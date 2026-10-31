// Music-aware helpers for lesson checks. They look at what the code *plays* (queried events),
// so any way of writing the same music passes.
import type { StrudelHap } from '@/lib/audio/engine';
import { evaluatePure, onsets } from '@/lib/strudel/pure';
import { parseProject } from '@/lib/sync/parseProject';
import type { CheckContext } from './types';

const EPS = 1e-6;

export const begin = (h: StrudelHap) => h.whole!.begin.valueOf();
export const sound = (h: StrudelHap) => String(h.value.s ?? '');

/** Builds the context checks run against. Null (with a message) if the code doesn't evaluate. */
export async function buildContext(code: string): Promise<{ ctx: CheckContext } | { error: string }> {
  const r = await evaluatePure(code);
  if (!r.ok) return { error: r.message };
  return {
    ctx: {
      code,
      pattern: r.pattern,
      model: parseProject(code),
      bpm: r.cpm !== undefined ? r.cpm * 4 : undefined,
      events: (cycles = 1) => onsets(r.pattern, 0, cycles),
    },
  };
}

/** Onset times (within the bar, 0–1) of events matching `filter` in cycle `cycle`. */
export function times(ctx: CheckContext, filter: (h: StrudelHap) => boolean, cycle = 0): number[] {
  return onsets(ctx.pattern, cycle, cycle + 1)
    .filter(filter)
    .map((h) => begin(h) - cycle)
    .sort((a, b) => a - b);
}

export function sameTimes(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) < EPS);
}

/** True if `sound` plays exactly at `expected` positions in every one of the first `cycles` bars. */
export function playsAt(ctx: CheckContext, s: string, expected: number[], cycles = 2): boolean {
  for (let c = 0; c < cycles; c++) if (!sameTimes(times(ctx, (h) => sound(h) === s, c), expected)) return false;
  return true;
}

/** True if `sound` plays at least at `expected` positions (it may play elsewhere too). */
export function includesTimes(ctx: CheckContext, s: string, expected: number[]): boolean {
  const t = times(ctx, (h) => sound(h) === s);
  return expected.every((e) => t.some((x) => Math.abs(x - e) < EPS));
}

export function eventsOf(ctx: CheckContext, s: string, cycles = 1): StrudelHap[] {
  return ctx.events(cycles).filter((h) => sound(h) === s);
}

/** Every event of `s` has `key` equal to `value` (case-insensitive for strings). */
export function allHave(ctx: CheckContext, s: string, key: string, value: unknown): boolean {
  const evs = eventsOf(ctx, s);
  const norm = (v: unknown) => (typeof v === 'string' ? v.toLowerCase() : v);
  return evs.length > 0 && evs.every((h) => norm(h.value[key]) === norm(value));
}

/** Distinct values of `key` among events (in the first `cycles` bars). */
export function valuesOf(ctx: CheckContext, key: string, cycles = 1, filter: (h: StrudelHap) => boolean = () => true): unknown[] {
  return [...new Set(ctx.events(cycles).filter(filter).map((h) => h.value[key]))];
}

/** The code calls this function or method somewhere (for "use X" tasks). */
export function uses(ctx: CheckContext, name: string): boolean {
  return new RegExp(`(^|[^\\w$])${name.replace(/[.$]/g, '\\$&')}\\s*\\(`).test(ctx.code);
}

/** A const with this name exists. */
export function defines(ctx: CheckContext, name: string): boolean {
  return ctx.model.blocks.some((b) => b.name === name);
}

/** Pitched events (any with a note or a frequency). */
export function pitched(ctx: CheckContext, cycles = 1): StrudelHap[] {
  return ctx.events(cycles).filter((h) => h.value.note !== undefined || h.value.freq !== undefined || h.value.n !== undefined && !h.value.s);
}

/** MIDI number of an event's note (Strudel note names or numbers). */
export function midiOf(h: StrudelHap): number | null {
  const n = h.value.note;
  if (typeof n === 'number') return n;
  if (typeof n !== 'string') return null;
  const m = /^([a-gA-G])(#|b|s|f)?(-?\d+)$/.exec(n);
  if (!m) return null;
  const base = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[m[1].toLowerCase()]!;
  const acc = m[2] === '#' || m[2] === 's' ? 1 : m[2] === 'b' || m[2] === 'f' ? -1 : 0;
  return base + acc + (Number(m[3]) + 1) * 12;
}

const SCALES: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
};
const TONIC: Record<string, number> = { c: 0, db: 1, 'c#': 1, d: 2, eb: 3, 'd#': 3, e: 4, f: 5, gb: 6, 'f#': 6, g: 7, ab: 8, 'g#': 8, a: 9, bb: 10, 'a#': 10, b: 11 };

/** True if the MIDI note belongs to a key written like "C:minor". */
export function inKey(midi: number, key: string): boolean {
  const [tonic, mode = 'major'] = key.toLowerCase().split(':');
  const steps = SCALES[mode];
  const root = TONIC[tonic];
  if (!steps || root === undefined) return false;
  return steps.includes((((midi - root) % 12) + 12) % 12);
}

/** Pitch class (0 = C) of the lowest note sounding at the start of bar `cycle`. */
export function lowestPitchClass(ctx: CheckContext, cycle: number): number | null {
  const ms = onsets(ctx.pattern, cycle, cycle + 1).map(midiOf).filter((m): m is number => m !== null);
  return ms.length ? Math.min(...ms) % 12 : null;
}

/** The largest number of notes that start at the same moment within the first bar. */
export function maxChordSize(ctx: CheckContext): number {
  const counts = new Map<number, number>();
  for (const h of ctx.events()) if (h.value.note !== undefined) counts.set(Math.round(begin(h) * 1e6), (counts.get(Math.round(begin(h) * 1e6)) ?? 0) + 1);
  return Math.max(0, ...counts.values());
}

/** Events in bar `cycle` (optionally filtered). */
export function inBar(ctx: CheckContext, cycle: number, filter: (h: StrudelHap) => boolean = () => true): StrudelHap[] {
  return onsets(ctx.pattern, cycle, cycle + 1).filter(filter);
}

/** Numeric value of `key` on events of bar `cycle` matching filter. */
export function numbersInBar(ctx: CheckContext, cycle: number, key: string, filter: (h: StrudelHap) => boolean = () => true): number[] {
  return inBar(ctx, cycle, filter)
    .map((h) => Number(h.value[key]))
    .filter((n) => Number.isFinite(n));
}

/** Arrangement rows from the parsed code ([bars, section name]). */
export function arrangement(ctx: CheckContext): { bars: number; name: string }[] {
  const f = ctx.model.final;
  if (f?.kind !== 'arrange') return [];
  return f.rows.map((r) => ({ bars: r.bars.kind === 'number' ? r.bars.value : 0, name: r.section.name }));
}

/** Bar index where the arrangement row `index` starts. */
export function sectionStart(ctx: CheckContext, index: number): number {
  return arrangement(ctx)
    .slice(0, index)
    .reduce((sum, r) => sum + r.bars, 0);
}

export const isNote = (h: StrudelHap) => h.value.note !== undefined;
