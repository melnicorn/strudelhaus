// Converts between a 16-step grid (one bar of 16th notes) and mini-notation.
//
// The GUI only *rewrites* strings in canonical grid form (docs/design.md §3.2):
//   four beat slots separated by spaces, each slot one of
//     ~            silent beat
//     tok          one hit on the beat
//     [a b]        two 8th notes
//     [a b c d]    four 16th notes
//   or, when all four beats are the same, one slot followed by *4 ("bd*4", "[~ oh]*4").
// Anything else (euclid, <alternation>, !, @, …) can still be *shown* by querying the pattern,
// but editing it requires the learner to confirm a rewrite.

/** A step holds the token that plays there (a sound or note name), or null for silence. */
export type Steps = (string | null)[];

export const STEPS = 16;

const TOKEN = /^[A-Za-z0-9#:._-]+$/;

/** Parses a canonical grid string into 16 steps, or null if it isn't canonical. */
export function parseGrid(src: string): Steps | null {
  const text = src.trim();
  const collapsed = /^(.+)\*4$/.exec(text);
  if (collapsed && !/\s/.test(collapsed[1].replace(/^\[.*\]$/, 'x'))) {
    const beat = parseBeat(collapsed[1]);
    return beat ? [...beat, ...beat, ...beat, ...beat] : null;
  }
  const slots = splitTop(text);
  if (!slots) return null;
  // "bd" (whole bar) and "bd sd" (half bars) are grids too: one hit at the start of each slot.
  if ((slots.length === 1 || slots.length === 2) && slots.every((x) => x === '~' || x === '-' || TOKEN.test(x))) {
    const steps: Steps = Array(STEPS).fill(null);
    slots.forEach((x, i) => (steps[(i * STEPS) / slots.length] = x === '~' || x === '-' ? null : x));
    return steps;
  }
  if (slots.length !== 4) return null;
  const steps: Steps = [];
  for (const slot of slots) {
    const beat = parseBeat(slot);
    if (!beat) return null;
    steps.push(...beat);
  }
  return steps;
}

function parseBeat(slot: string): Steps | null {
  if (slot === '~' || slot === '-') return [null, null, null, null];
  if (TOKEN.test(slot)) return [slot, null, null, null];
  const m = /^\[([^\[\]]+)\]$/.exec(slot);
  if (!m) return null;
  const toks = m[1].trim().split(/\s+/);
  if (!toks.every((t) => t === '~' || t === '-' || TOKEN.test(t))) return null;
  const val = (t: string) => (t === '~' || t === '-' ? null : t);
  if (toks.length === 4) return toks.map(val);
  if (toks.length === 2) return [val(toks[0]), null, val(toks[1]), null];
  return null;
}

/** Splits on top-level spaces (not inside brackets). Null on unbalanced brackets. */
function splitTop(text: string): string[] | null {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of text) {
    if (ch === '[') depth++;
    if (ch === ']') depth--;
    if (depth < 0) return null;
    if (/\s/.test(ch) && depth === 0) {
      if (cur) out.push(cur);
      cur = '';
    } else cur += ch;
  }
  if (depth !== 0) return null;
  if (cur) out.push(cur);
  return out;
}

/** Writes 16 steps as canonical mini-notation. */
export function gridToMini(steps: Steps): string {
  if (steps.length !== STEPS) throw new Error(`expected ${STEPS} steps`);
  const beats = [0, 1, 2, 3].map((b) => beatToMini(steps.slice(b * 4, b * 4 + 4)));
  if (beats.every((b) => b === beats[0])) return beats[0] === '~' ? '~' : `${beats[0]}*4`;
  return beats.join(' ');
}

function beatToMini(beat: Steps): string {
  const t = beat.map((s) => s ?? '~');
  if (beat.every((s) => s === null)) return '~';
  if (beat[1] === null && beat[2] === null && beat[3] === null) return t[0];
  if (beat[1] === null && beat[3] === null) return `[${t[0]} ${t[2]}]`;
  return `[${t.join(' ')}]`;
}

/** True if the string is already in the form gridToMini would write for its own steps. */
export function isCanonicalGrid(src: string): boolean {
  const steps = parseGrid(src);
  return !!steps && gridToMini(steps) === src.trim();
}

export interface QueriedHap {
  begin: number;
  end: number;
  token: string;
}

/**
 * Builds steps from queried events of one cycle. Returns null if any onset falls between
 * 16th notes (so a grid can't show it honestly).
 */
export function stepsFromHaps(haps: QueriedHap[]): Steps | null {
  const steps: Steps = Array(STEPS).fill(null);
  for (const h of haps) {
    const pos = h.begin * STEPS;
    const idx = Math.round(pos);
    if (Math.abs(pos - idx) > 1e-6 || idx < 0 || idx >= STEPS) return null;
    if (steps[idx] && steps[idx] !== h.token) return null; // two different sounds on one step
    steps[idx] = h.token;
  }
  return steps;
}

// ---------- number sequences: .gain(".6 .3 .9 .3") / .gain("[.6 .3 .9 .3]*4") ----------

export interface NumberSeq {
  values: number[];
  /** "[…]*n" repeat count; 1 when written as a plain list. */
  repeat: number;
}

const NUM = /^-?(\d+\.?\d*|\.\d+)$/;

/**
 * Parses "a b c", "[a b c]*n", or 16 values written as four beat groups
 * "[a b c d] [e f g h] [i j k l] [m n o p]"; null for anything else.
 */
export function parseNumberSeq(src: string): NumberSeq | null {
  const text = src.trim();
  const groups = splitTop(text);
  if (groups && groups.length === 4 && groups.every((g) => /^\[[^\[\]]+\]$/.test(g))) {
    const parts = groups.map((g) => g.slice(1, -1).trim().split(/\s+/));
    if (parts.every((p) => p.length === 4 && p.every((x) => NUM.test(x)))) {
      return { values: parts.flat().map(Number), repeat: 1 };
    }
  }
  const rep = /^\[([^\[\]]+)\]\*(\d+)$/.exec(text);
  const body = rep ? rep[1] : text;
  const parts = body.trim().split(/\s+/);
  if (!parts.length || !parts.every((p) => NUM.test(p))) return null;
  return { values: parts.map(Number), repeat: rep ? Number(rep[2]) : 1 };
}

export function numberSeqToMini({ values, repeat }: NumberSeq): string {
  if (values.length === STEPS && repeat === 1) {
    // One value per 16th: group by beat so it lines up with the step pattern it belongs to.
    return [0, 1, 2, 3].map((b) => `[${values.slice(b * 4, b * 4 + 4).map(formatNumber).join(' ')}]`).join(' ');
  }
  const body = values.map(formatNumber).join(' ');
  return repeat > 1 ? `[${body}]*${repeat}` : body;
}

/** Plain, short number formatting for generated code: .25 not 0.25000. */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '0';
  const rounded = Math.round(n * 1000) / 1000;
  let s = String(rounded);
  if (s.startsWith('0.')) s = s.slice(1);
  else if (s.startsWith('-0.')) s = '-' + s.slice(2);
  return s;
}
