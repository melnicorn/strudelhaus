// The shape of content/styles/*.json (one music style each) and content/sounds/*.json (sound
// recipes that several styles share). The Styles pages are drawn entirely from these files:
// a style's `id` is its URL (/styles/<id>) and a sound's `id` the part after it.
import { z } from 'zod';

/** Ids become URL segments: lowercase letters, digits and hyphens. */
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'ids use lowercase letters, digits and hyphens');

/** The slots every style fills, in the order the page lists them. A sound's `group` is one of these ids. */
export const GROUPS = [
  { id: 'kick', label: 'Kick' },
  { id: 'groove', label: 'Tops and groove' },
  { id: 'bass', label: 'Bass' },
  { id: 'harmony', label: 'Harmony' },
  { id: 'hook', label: 'Hooks and effects' },
] as const;
const group = z.enum(GROUPS.map((g) => g.id));

/** One number in an ingredient's code, with the range where it sounds right for the style. */
export const knobSchema = z
  .strictObject({
    /** The `{name}` this knob fills in the ingredient's code or layer. */
    param: z.string().regex(/^[a-z][A-Za-z0-9]*$/),
    /** Shown under the knob; the param name by default. */
    label: z.string().optional(),
    unit: z.enum(['hz', 'seconds', 'int']).optional(),
    /** Logarithmic travel. For frequencies only: the knob's log scale snaps to whole Hz. */
    log: z.boolean().optional(),
    step: z.number().positive().optional(),
    min: z.number(),
    max: z.number(),
    value: z.number(),
    /** [low, high]: inside this the sound is right for the style. */
    sweet: z.tuple([z.number(), z.number()]),
    /** What you hear below the sweet spot, and above it. */
    below: z.string(),
    above: z.string(),
  })
  .refine((k) => k.min < k.max && k.min <= k.sweet[0] && k.sweet[0] < k.sweet[1] && k.sweet[1] <= k.max, 'need min ≤ sweet low < sweet high ≤ max')
  .refine((k) => k.value >= k.min && k.value <= k.max, 'value is outside min–max')
  .refine((k) => !k.log || (k.unit === 'hz' && k.min >= 20), 'log is for hz knobs starting at 20 or more');

/** Code for backing-loop parts by id; null leaves that part out. */
const contextOverride = z.record(id, z.string().nullable());

/** One step in building a sound: a slice of the method chain you can switch on and off. */
export const ingredientSchema = z.strictObject({
  id,
  name: z.string(),
  /** Methods added to the chain, e.g. `.lpf({lpf})`. `{name}` is filled from a knob. */
  code: z.string().optional(),
  /** Replaces the sound's note pattern while this ingredient is on. */
  pattern: z.string().optional(),
  /** A whole second part played alongside, e.g. `s("~ cp").bank("RolandTR909")`: the sound becomes a stack. */
  layer: z.string().optional(),
  /** `code` goes on the whole stack (every layer) instead of the first part's chain. Swing, for one. */
  whole: z.boolean().optional(),
  /** The starting point: always on. */
  required: z.boolean().optional(),
  /** An earlier ingredient this one only works with. */
  needs: id.optional(),
  /** An earlier ingredient this one takes the place of. */
  replaces: id.optional(),
  /** Changes to the backing loop while this ingredient is on (heard with "In context"). */
  context: contextOverride.optional(),
  adds: z.string(),
  listenFor: z.string().optional(),
  knobs: z.array(knobSchema).optional(),
});

/** A named tuning: knob values to set and ingredients to switch off. */
export const variationSchema = z.strictObject({
  name: z.string(),
  set: z.record(z.string(), z.number()).optional(),
  off: z.array(id).optional(),
});

const soundFields = {
  name: z.string(),
  role: z.string(),
  /** Which of the page's five slots it fills. */
  group,
  /** What makes this sound belong to the style, in a sentence or two. */
  why: z.string(),
  /** The notes or hits, before any ingredient: `note("a1*16")`. */
  pattern: z.string(),
  ingredients: z.array(ingredientSchema).min(1),
  variations: z.array(variationSchema).optional(),
  pitfalls: z.array(z.string()).optional(),
  /** Lesson ids (content/lessons) that teach the pieces. */
  lessons: z.array(z.string()).optional(),
  /** Changes to the style's backing loop whenever this sound is shown. */
  context: contextOverride.optional(),
};

/** A shared recipe in content/sounds/<name>.json; its file name is what `extends` refers to. */
export const archetypeSchema = z.strictObject(soundFields);

/** A sound in a style: written out in full, or `extends` a shared recipe and overrides parts of it. */
export const styleSoundSchema = archetypeSchema.partial().extend({
  id,
  extends: z.string().optional(),
  /** New default values for the recipe's knobs, by param. */
  set: z.record(z.string(), z.number()).optional(),
  /** New sweet spots for the recipe's knobs, by param: where it sounds right for this style. */
  sweet: z.record(z.string(), z.tuple([z.number(), z.number()])).optional(),
});

export const styleSchema = z.strictObject({
  id,
  name: z.string(),
  /** The wider family it belongs to ("House", "Techno"): the index lists styles under it. */
  family: z.string(),
  era: z.string(),
  /** Beats per minute. */
  tempo: z.number().positive(),
  key: z.string(),
  blurb: z.string(),
  /** The backing loop "In context" plays under a sound, one part per line of a stack. */
  context: z.array(z.strictObject({ id, code: z.string() })),
  sounds: z.array(styleSoundSchema).min(1),
});

export type Group = (typeof GROUPS)[number]['id'];
export type Knob = z.infer<typeof knobSchema>;
export type Variation = z.infer<typeof variationSchema>;
export type Archetype = z.infer<typeof archetypeSchema>;
export type StyleSound = z.infer<typeof styleSoundSchema>;
export type StyleConfig = z.infer<typeof styleSchema>;
export type ContextPart = StyleConfig['context'][number];

/** An ingredient with its knobs always present. */
export type Ingredient = Omit<z.infer<typeof ingredientSchema>, 'knobs'> & { knobs: Knob[] };

/** A style's sound with its recipe merged in: everything the page needs. */
export interface Sound {
  id: string;
  /** The shared recipe it came from, if any. */
  extends?: string;
  name: string;
  role: string;
  group: Group;
  why: string;
  pattern: string;
  ingredients: Ingredient[];
  variations: Variation[];
  pitfalls: string[];
  lessons: { id: string; number: number; title: string }[];
  context: Record<string, string | null>;
}

export interface Style extends Omit<StyleConfig, 'sounds'> {
  sounds: Sound[];
}

/** Which ingredients are switched on and where each knob sits. */
export interface SoundState {
  on: Record<string, boolean>;
  vals: Record<string, number>;
}
