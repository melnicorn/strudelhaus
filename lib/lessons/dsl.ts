// The check language: lesson checks written as data, so lesson packs are plain JSON that can be
// loaded, validated and written (by people or the assistant) without any code. Each expression
// compiles to a predicate over a CheckContext; the vocabulary is the helpers in checks.ts.
//
//   { "playsAt": { "s": "bd", "at": [0, 0.25, 0.5, 0.75] } }
//   { "all": [ { "defines": "hats" }, { "gte": [ { "count": { "s": "hh" } }, 8 ] } ] }
//   { "every": { "sel": { "note": true }, "where": [ { "key": "resonance", "gte": 12, "default": 0 } ] } }
import { z } from 'zod';
import type { StrudelHap } from '@/lib/audio/engine';
import { onsets } from '@/lib/strudel/pure';
import { arrangement, begin, inKey, lowestPitchClass, maxChordSize, midiOf, sameTimes, sectionStart, sound, uses } from './checks';
import type { CheckContext } from './types';

// ---------- schema ----------

const scalar = z.union([z.number(), z.string(), z.boolean()]);

/** Which events to look at. Default: every event that starts in the first bar. */
export const selSchema = z
  .object({
    /** Sound name(s): `s("bd")` matches "bd". */
    s: z.union([z.string(), z.array(z.string())]).optional(),
    /** Only pitched events (ones with a note). */
    note: z.boolean().optional(),
    /** One bar (0-based) instead of the first `cycles` bars. */
    bar: z.number().int().min(0).optional(),
    cycles: z.number().int().min(1).optional(),
    /** Only events starting at this position within the bar (0–1). */
    at: z.number().min(0).max(1).optional(),
    where: z.lazy(() => z.array(condSchema)).optional(),
  })
  .strict();

const valueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    scalar,
    z.array(scalar),
    z.object({ count: selSchema }).strict(),
    /** How many different values of `key` the selected events have (or, with `bars`, the first event of each listed bar). */
    z.object({ distinct: z.object({ sel: selSchema.optional(), key: z.string(), round: z.number().int().optional(), bars: z.array(z.number().int().min(0)).optional() }).strict() }).strict(),
    /** The values of `key` in event order (optionally unique and sorted), for comparing bars. */
    z.object({ values: z.object({ sel: selSchema.optional(), key: z.string(), unique: z.boolean().optional(), sorted: z.boolean().optional() }).strict() }).strict(),
    /** The onset (0–1 within the bar) of the nth selected event. */
    z.object({ timeAt: z.object({ sel: selSchema, index: z.number().int().min(0) }).strict() }).strict(),
    z.object({ valueAt: z.object({ sel: selSchema.optional(), key: z.string(), index: z.number().int().optional(), default: scalar.optional() }).strict() }).strict(),
    z.object({ max: z.object({ sel: selSchema.optional(), key: z.string(), default: z.number().optional() }).strict() }).strict(),
    z.object({ min: z.object({ sel: selSchema.optional(), key: z.string(), default: z.number().optional() }).strict() }).strict(),
    z.object({ times: selSchema }).strict(),
    z.object({ bpm: z.literal(true) }).strict(),
    z.object({ key: z.literal(true) }).strict(),
    z.object({ maxChordSize: z.literal(true) }).strict(),
    z.object({ lowestPitchClass: z.object({ bar: z.number().int().min(0) }).strict() }).strict(),
    z.object({ rows: z.literal(true) }).strict(),
    z.object({ rowBars: z.number().int().min(0) }).strict(),
    z.object({ rowStart: z.number().int().min(0) }).strict(),
    z.object({ maxCount: z.object({ sel: selSchema, bars: z.number().int().min(1) }).strict() }).strict(),
    z.object({ plus: z.tuple([valueSchema, valueSchema]) }).strict(),
    z.object({ minus: z.tuple([valueSchema, valueSchema]) }).strict(),
    z.object({ mul: z.tuple([valueSchema, valueSchema]) }).strict(),
  ]),
);

/**
 * A condition on one event value. Missing values read as `default` (or fail the condition).
 * Besides Strudel controls (gain, cutoff, bank…), `key` may be $midi, $pc (pitch class 0–11),
 * $note (the note as written) or $time (onset within the bar).
 */
const condSchema = z
  .object({
    key: z.string(),
    default: scalar.optional(),
    eq: scalar.optional(),
    neq: scalar.optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    lt: z.number().optional(),
    lte: z.number().optional(),
    defined: z.boolean().optional(),
    in: z.array(scalar).optional(),
  })
  .strict();

const pair = z.tuple([valueSchema, valueSchema]);

export const checkSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.object({ all: z.array(checkSchema).min(1) }).strict(),
    z.object({ any: z.array(checkSchema).min(1) }).strict(),
    z.object({ not: checkSchema }).strict(),
    /** `s` (or `sel`) plays exactly at `at` in each of the first `cycles` bars (default 2). */
    z.object({ playsAt: z.object({ s: z.string().optional(), sel: selSchema.optional(), at: z.array(z.number()), cycles: z.number().int().min(1).optional() }).strict() }).strict(),
    /** Plays at least at `at` (and maybe elsewhere) in the first bar. */
    z.object({ includesTimes: z.object({ s: z.string().optional(), sel: selSchema.optional(), at: z.array(z.number()) }).strict() }).strict(),
    /** Every selected event meets every condition; false when nothing is selected unless allowEmpty. */
    z.object({ every: z.object({ sel: selSchema, where: z.array(condSchema), allowEmpty: z.boolean().optional() }).strict() }).strict(),
    /** At least one selected event meets every condition. */
    z.object({ some: z.object({ sel: selSchema, where: z.array(condSchema).optional() }).strict() }).strict(),
    /** The source matches this regular expression. */
    z.object({ matches: z.string() }).strict(),
    /** The source calls this function or method. */
    z.object({ uses: z.string() }).strict(),
    /** A const with this name exists. */
    z.object({ defines: z.string() }).strict(),
    /** A const with this name exists, with this block kind (part, modifier, group, section, key, custom) and, for a group, these members. */
    z.object({ block: z.object({ name: z.string(), kind: z.union([z.string(), z.array(z.string())]).optional(), members: z.array(z.string()).optional() }).strict() }).strict(),
    /** The value exists (e.g. { "defined": { "key": true } }: the code sets `const key`). */
    z.object({ defined: valueSchema }).strict(),
    /** The final expression is a stack, arrange, part or custom. */
    z.object({ final: z.enum(['stack', 'arrange', 'part', 'custom']) }).strict(),
    /** Every selected note (default: all notes in the first bar) is in `key`, or in the code's `const key`. */
    z.object({ inKey: z.object({ sel: selSchema.optional(), key: z.string().optional() }).strict() }).strict(),
    z.object({ eq: pair }).strict(),
    z.object({ neq: pair }).strict(),
    z.object({ gt: pair }).strict(),
    z.object({ gte: pair }).strict(),
    z.object({ lt: pair }).strict(),
    z.object({ lte: pair }).strict(),
    /** A named check written in code (built-in packs only). */
    z.object({ custom: z.string() }).strict(),
  ]),
);

export type Sel = z.infer<typeof selSchema>;
export type Cond = z.infer<typeof condSchema>;
export type CheckExpr = unknown;

export type Predicate = (ctx: CheckContext) => boolean;
export type Customs = Record<string, Predicate>;

// ---------- evaluation ----------

const EPS = 1e-6;
const isNote = (h: StrudelHap) => h.value.note !== undefined;
const norm = (v: unknown) => (typeof v === 'string' ? v.toLowerCase() : v);
const num = (v: unknown, fallback = NaN) => (v === undefined || v === null ? fallback : Number(v));

/** An event's value for `key`, including the computed $midi, $pc, $note and $time. */
function field(h: StrudelHap, key: string): unknown {
  switch (key) {
    case '$midi':
      return midiOf(h) ?? undefined;
    case '$pc': {
      const m = midiOf(h);
      return m === null ? undefined : ((m % 12) + 12) % 12;
    }
    case '$note':
      return h.value.note === undefined ? undefined : String(h.value.note);
    case '$time':
      return begin(h) - Math.floor(begin(h));
    default:
      return h.value[key];
  }
}

function select(ctx: CheckContext, sel: Sel | undefined): StrudelHap[] {
  const s = sel ?? {};
  let evs = s.bar !== undefined ? onsets(ctx.pattern, s.bar, s.bar + 1) : ctx.events(s.cycles ?? 1);
  if (s.s !== undefined) {
    const names = (Array.isArray(s.s) ? s.s : [s.s]).map((x) => x.toLowerCase());
    evs = evs.filter((h) => names.includes(sound(h).toLowerCase()));
  }
  if (s.note) evs = evs.filter(isNote);
  if (s.at !== undefined) evs = evs.filter((h) => Math.abs(begin(h) - Math.floor(begin(h)) - s.at!) < EPS);
  if (s.where) evs = evs.filter((h) => s.where!.every((c) => holds(h, c)));
  return evs;
}

function holds(h: StrudelHap, c: Cond): boolean {
  const raw = field(h, c.key);
  const v = raw === undefined ? c.default : raw;
  if (c.defined !== undefined && (raw !== undefined) !== c.defined) return false;
  if (c.defined !== undefined && Object.keys(c).length === 2) return true;
  if (v === undefined) return false;
  if (c.eq !== undefined && norm(v) !== norm(c.eq)) return false;
  if (c.neq !== undefined && norm(v) === norm(c.neq)) return false;
  if (c.in !== undefined && !c.in.map(norm).includes(norm(v))) return false;
  const n = Number(v);
  if (c.gt !== undefined && !(n > c.gt)) return false;
  if (c.gte !== undefined && !(n >= c.gte)) return false;
  if (c.lt !== undefined && !(n < c.lt)) return false;
  if (c.lte !== undefined && !(n <= c.lte)) return false;
  return true;
}

function timesOf(ctx: CheckContext, sel: Sel): number[] {
  return select(ctx, sel)
    .map((h) => begin(h) - Math.floor(begin(h)))
    .sort((a, b) => a - b);
}

/** The `const key = "…"` value, lower-cased, if any. */
export function constKey(ctx: CheckContext): string | undefined {
  const b = ctx.model.blocks.find((x) => x.name === 'key');
  return b?.kind === 'key' && b.value.kind === 'string' ? String(b.value.value).toLowerCase() : undefined;
}

function value(ctx: CheckContext, v: unknown): unknown {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) return v;
  const node = v as Record<string, unknown>;
  const [k] = Object.keys(node);
  const a = node[k] as never;
  switch (k) {
    case 'count':
      return select(ctx, a).length;
    case 'distinct': {
      const { sel, key, round, bars } = a as { sel?: Sel; key: string; round?: number; bars?: number[] };
      const evs = bars ? bars.map((bar) => select(ctx, { ...sel, bar })[0]).filter((h): h is StrudelHap => !!h) : select(ctx, sel);
      const vals = evs.map((h) => field(h, key)).filter((x) => x !== undefined);
      return new Set(vals.map((x) => (round !== undefined ? Number(x).toFixed(round) : norm(x)))).size;
    }
    case 'values': {
      const { sel, key, unique, sorted } = a as { sel?: Sel; key: string; unique?: boolean; sorted?: boolean };
      let vals = select(ctx, sel).map((h) => norm(field(h, key))).filter((x) => x !== undefined);
      if (unique) vals = [...new Set(vals)];
      if (sorted) vals = [...vals].sort((x, y) => (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))));
      return vals;
    }
    case 'timeAt': {
      const { sel, index } = a as { sel: Sel; index: number };
      return timesOf(ctx, sel).at(index);
    }
    case 'valueAt': {
      const { sel, key, index = 0, default: d } = a as { sel?: Sel; key: string; index?: number; default?: unknown };
      const h = select(ctx, sel).at(index);
      const raw = h ? field(h, key) : undefined;
      return raw === undefined ? d : raw;
    }
    case 'max':
    case 'min': {
      const { sel, key, default: d } = a as { sel?: Sel; key: string; default?: number };
      const ns = select(ctx, sel).map((h) => num(field(h, key), d ?? NaN)).filter((n) => Number.isFinite(n));
      return ns.length ? (k === 'max' ? Math.max(...ns) : Math.min(...ns)) : undefined;
    }
    case 'times':
      return timesOf(ctx, a);
    case 'bpm':
      return ctx.bpm;
    case 'key':
      return constKey(ctx);
    case 'maxChordSize':
      return maxChordSize(ctx);
    case 'lowestPitchClass':
      return lowestPitchClass(ctx, (a as { bar: number }).bar) ?? undefined;
    case 'rows':
      return arrangement(ctx).length;
    case 'rowBars':
      return arrangement(ctx)[a as number]?.bars;
    case 'rowStart':
      return arrangement(ctx).length > (a as number) ? sectionStart(ctx, a as number) : undefined;
    case 'maxCount': {
      const { sel, bars } = a as { sel: Sel; bars: number };
      let best = 0;
      for (let b = 0; b < bars; b++) best = Math.max(best, select(ctx, { ...sel, bar: b }).length);
      return best;
    }
    case 'plus':
    case 'minus':
    case 'mul': {
      const [x, y] = (a as unknown[]).map((e) => Number(value(ctx, e)));
      return k === 'plus' ? x + y : k === 'minus' ? x - y : x * y;
    }
    default:
      throw new Error(`Unknown value node "${k}"`);
  }
}

const same = (x: unknown, y: unknown) => (Array.isArray(x) || Array.isArray(y) ? JSON.stringify(x) === JSON.stringify(y) : norm(x) === norm(y));

function compare(op: string, x: unknown, y: unknown): boolean {
  if (op === 'eq') return x !== undefined && same(x, y);
  if (op === 'neq') return !same(x, y);
  const a = Number(x);
  const b = Number(y);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return op === 'gt' ? a > b : op === 'gte' ? a >= b : op === 'lt' ? a < b : a <= b;
}

/**
 * Compiles a check expression. Throws on an expression the schema rejects, or on a `custom` name
 * the given registry doesn't have (community packs get an empty registry).
 */
export function compileCheck(expr: unknown, customs: Customs = {}): Predicate {
  const parsed = checkSchema.safeParse(expr);
  if (!parsed.success) throw new Error(`Invalid check: ${describeIssue(parsed.error.issues)} in ${JSON.stringify(expr)}`);
  return build(parsed.data, customs);
}

/** The most specific zod issue: a union reports one per branch, so dig for the deepest path. */
function describeIssue(issues: z.core.$ZodIssue[]): string {
  const flat: { path: string; message: string }[] = [];
  const walk = (list: z.core.$ZodIssue[], prefix: PropertyKey[]) => {
    for (const i of list) {
      const path = [...prefix, ...i.path];
      if (i.code === 'invalid_union') for (const branch of i.errors) walk(branch, path);
      else flat.push({ path: path.join('.'), message: i.message });
    }
  };
  walk(issues, []);
  flat.sort((a, b) => b.path.length - a.path.length);
  const best = flat[0];
  return best ? `${best.message}${best.path ? ` at ${best.path}` : ''}` : 'invalid';
}

function build(expr: unknown, customs: Customs): Predicate {
  const node = expr as Record<string, unknown>;
  const [k] = Object.keys(node);
  const a = node[k] as never;
  switch (k) {
    case 'all': {
      const parts = (a as unknown[]).map((e) => build(e, customs));
      return (c) => parts.every((p) => p(c));
    }
    case 'any': {
      const parts = (a as unknown[]).map((e) => build(e, customs));
      return (c) => parts.some((p) => p(c));
    }
    case 'not': {
      const p = build(a, customs);
      return (c) => !p(c);
    }
    case 'playsAt': {
      const { s, sel, at, cycles = 2 } = a as { s?: string; sel?: Sel; at: number[]; cycles?: number };
      const base: Sel = sel ?? { s };
      return (c) => {
        for (let b = 0; b < cycles; b++) if (!sameTimes(timesOf(c, { ...base, bar: b }), at)) return false;
        return true;
      };
    }
    case 'includesTimes': {
      const { s, sel, at } = a as { s?: string; sel?: Sel; at: number[] };
      const base: Sel = sel ?? { s };
      return (c) => {
        const t = timesOf(c, base);
        return at.every((e) => t.some((x) => Math.abs(x - e) < EPS));
      };
    }
    case 'every': {
      const { sel, where, allowEmpty } = a as { sel: Sel; where: Cond[]; allowEmpty?: boolean };
      return (c) => {
        const evs = select(c, sel);
        if (!evs.length) return !!allowEmpty;
        return evs.every((h) => where.every((w) => holds(h, w)));
      };
    }
    case 'some': {
      const { sel, where = [] } = a as { sel: Sel; where?: Cond[] };
      return (c) => select(c, sel).some((h) => where.every((w) => holds(h, w)));
    }
    case 'matches': {
      const re = new RegExp(a as string);
      return (c) => re.test(c.code);
    }
    case 'uses':
      return (c) => uses(c, a as string);
    case 'defines':
      return (c) => c.model.blocks.some((b) => b.name === a);
    case 'block': {
      const { name, kind, members } = a as { name: string; kind?: string | string[]; members?: string[] };
      const kinds = kind === undefined ? undefined : Array.isArray(kind) ? kind : [kind];
      return (c) =>
        c.model.blocks.some(
          (b) =>
            b.name === name &&
            (!kinds || kinds.includes(b.kind)) &&
            (!members || ((b.kind === 'group' || b.kind === 'section') && members.every((m) => b.members.some((x) => x.base === m)))),
        );
    }
    case 'defined':
      return (c) => value(c, a) !== undefined;
    case 'final':
      return (c) => c.model.final?.kind === a;
    case 'inKey': {
      const { sel, key } = a as { sel?: Sel; key?: string };
      return (c) => {
        const k2 = key ?? constKey(c);
        if (!k2) return false;
        const ms = select(c, { note: true, ...sel }).map(midiOf).filter((m): m is number => m !== null);
        return ms.length > 0 && ms.every((m) => inKey(m, k2));
      };
    }
    case 'eq':
    case 'neq':
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte': {
      const [x, y] = a as [unknown, unknown];
      return (c) => compare(k, value(c, x), value(c, y));
    }
    case 'custom': {
      const p = customs[a as string];
      if (!p) throw new Error(`Unknown custom check "${a}"`);
      return p;
    }
    default:
      throw new Error(`Unknown check "${k}"`);
  }
}

/** The names of custom checks an expression uses (to refuse them in community packs). */
export function customsUsed(expr: unknown, out: string[] = []): string[] {
  if (expr && typeof expr === 'object') {
    const node = expr as Record<string, unknown>;
    if (typeof node.custom === 'string') out.push(node.custom);
    for (const v of Object.values(node)) if (v && typeof v === 'object') customsUsed(v, out);
  }
  return out;
}
