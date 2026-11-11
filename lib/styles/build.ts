// Turns a style's sound and its switches and knobs into Strudel code. Pure: used by the page,
// by "Add to sandbox" and by the tests that evaluate every config.
import { formatNumber } from '@/lib/sync/miniGrid';
import { knobSchema, type Archetype, type Ingredient, type Knob, type Sound, type SoundState, type Style, type StyleSound, type Variation } from './types';

/** Merges a style's sound with the recipe it extends. Throws when something is missing. */
export function resolveSound(
  sound: StyleSound,
  archetypes: Record<string, Archetype>,
  lessonOf: (id: string) => { id: string; number: number; title: string } | undefined,
): Sound {
  const base = sound.extends ? archetypes[sound.extends] : undefined;
  if (sound.extends && !base) throw new Error(`Sound "${sound.id}" extends "${sound.extends}", which is not in content/sounds/.`);
  const merged = { ...base, ...sound };
  for (const field of ['name', 'role', 'group', 'why', 'pattern', 'ingredients'] as const) {
    if (merged[field] === undefined) throw new Error(`Sound "${sound.id}" has no ${field}.`);
  }
  const set = sound.set ?? {};
  const sweet = sound.sweet ?? {};
  const known = new Set(merged.ingredients!.flatMap((i) => (i.knobs ?? []).map((k) => k.param)));
  for (const param of [...Object.keys(set), ...Object.keys(sweet)]) {
    if (!known.has(param)) throw new Error(`Sound "${sound.id}" sets "${param}", which is not one of its knobs.`);
  }
  // A style's own value and sweet spot for a shared recipe's knob; the result must still be a valid knob.
  const tune = (k: Knob): Knob => {
    if (!(k.param in set) && !(k.param in sweet)) return k;
    const tuned = knobSchema.safeParse({ ...k, value: set[k.param] ?? k.value, sweet: sweet[k.param] ?? k.sweet });
    if (!tuned.success) throw new Error(`Sound "${sound.id}", knob "${k.param}": ${tuned.error.issues[0].message}`);
    return tuned.data;
  };
  return {
    id: sound.id,
    extends: sound.extends,
    name: merged.name!,
    role: merged.role!,
    group: merged.group!,
    why: merged.why!,
    pattern: merged.pattern!,
    ingredients: merged.ingredients!.map((i) => ({ ...i, knobs: (i.knobs ?? []).map(tune) })),
    variations: merged.variations ?? [],
    pitfalls: merged.pitfalls ?? [],
    lessons: (merged.lessons ?? []).map((lessonId) => {
      const lesson = lessonOf(lessonId);
      if (!lesson) throw new Error(`Sound "${sound.id}" links to lesson "${lessonId}", which does not exist.`);
      return lesson;
    }),
    context: { ...base?.context, ...sound.context },
  };
}

/** Everything on, every knob at its value for this style. */
export function defaultState(sound: Sound): SoundState {
  const state: SoundState = { on: {}, vals: {} };
  for (const ing of sound.ingredients) {
    state.on[ing.id] = true;
    for (const k of ing.knobs) state.vals[k.param] = k.value;
  }
  return state;
}

/** Only the starting point: what "Build from scratch" begins with. */
export function strippedState(sound: Sound, state: SoundState): SoundState {
  return { ...state, on: Object.fromEntries(sound.ingredients.map((i) => [i.id, !!i.required])) };
}

export function applyVariation(sound: Sound, variation: Variation): SoundState {
  const state = defaultState(sound);
  for (const off of variation.off ?? []) state.on[off] = false;
  Object.assign(state.vals, variation.set);
  return state;
}

export type IngredientStatus = 'on' | 'off' | 'blocked' | 'replaced';

/**
 * Where each ingredient stands: `blocked` when the one it needs is off, `replaced` when a
 * later one that is on takes its place.
 */
export function statuses(sound: Sound, state: SoundState): Record<string, IngredientStatus> {
  const result: Record<string, IngredientStatus> = {};
  for (const ing of sound.ingredients) {
    result[ing.id] = ing.needs && !state.on[ing.needs] ? 'blocked' : state.on[ing.id] || ing.required ? 'on' : 'off';
  }
  for (const ing of sound.ingredients) {
    if (ing.replaces && result[ing.id] === 'on' && result[ing.replaces] === 'on') result[ing.replaces] = 'replaced';
  }
  return result;
}

const fill = (code: string, state: SoundState) => code.replace(/\{(\w+)\}/g, (_, param) => formatNumber(state.vals[param]));

export interface CodeLine {
  text: string;
  /** The ingredient this line comes from, when there is one. */
  ingredient?: string;
}

/**
 * The sound alone as one expression: the pattern, then a line per ingredient that is on.
 * Ingredients with a `layer` make it a stack of parts; `whole` ones then follow the stack.
 */
export function soundLines(sound: Sound, state: SoundState): CodeLine[] {
  const status = statuses(sound, state);
  const active = sound.ingredients.filter((i) => status[i.id] === 'on');
  const patterned = active.findLast((i) => i.pattern);
  const main: CodeLine[] = [{ text: patterned?.pattern ?? sound.pattern, ingredient: patterned?.id }];
  const layers: CodeLine[] = [];
  const after: CodeLine[] = [];
  for (const ing of active) {
    if (ing.code) (ing.whole ? after : main).push({ text: `  ${fill(ing.code, state)}`, ingredient: ing.id });
    if (ing.layer) layers.push({ text: `  ${fill(ing.layer, state)},`, ingredient: ing.id });
  }
  if (layers.length === 0) return [...main, ...after];
  main[main.length - 1] = { ...main[main.length - 1], text: `${main[main.length - 1].text},` };
  return [{ text: 'stack(' }, ...main.map((l) => ({ ...l, text: `  ${l.text}` })), ...layers, { text: ')' }, ...after];
}

/** The backing loop's parts for this sound, after the sound's and its ingredients' overrides. */
function contextParts(style: Style, sound: Sound, state: SoundState, active: Ingredient[]): string[] {
  const overrides: Record<string, string | null> = { ...sound.context };
  for (const ing of active) Object.assign(overrides, ing.context);
  return style.context.flatMap((part) => {
    const code = part.id in overrides ? overrides[part.id] : part.code;
    return code === null ? [] : [fill(code, state)];
  });
}

/** The whole program: tempo, then the sound alone or stacked on the style's backing loop. */
export function buildCode(style: Style, sound: Sound, state: SoundState, inContext: boolean): { lines: CodeLine[]; code: string } {
  const own = soundLines(sound, state);
  const lines: CodeLine[] = [{ text: `setcpm(${formatNumber(style.tempo)}/4)` }, { text: '' }];
  const status = statuses(sound, state);
  const parts = inContext ? contextParts(style, sound, state, sound.ingredients.filter((i) => status[i.id] === 'on')) : [];
  if (parts.length === 0) lines.push(...own);
  else {
    lines.push({ text: 'stack(' });
    lines.push(...parts.map((code) => ({ text: `  ${code},` })));
    lines.push(...own.map((l) => ({ ...l, text: `  ${l.text}` })));
    lines.push({ text: ')' });
  }
  return { lines, code: lines.map((l) => l.text).join('\n') + '\n' };
}

/** Where a knob's value sits against its sweet spot. */
export function verdict(k: { sweet: [number, number] }, value: number): 'below' | 'in' | 'above' {
  return value < k.sweet[0] ? 'below' : value > k.sweet[1] ? 'above' : 'in';
}
