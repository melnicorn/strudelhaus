// The cheat sheet: built from research.md §3 and the GUI allowlist, and tested (every example
// must evaluate). "learnedIn" comes from the lessons' `introduces` lists.
import { lessons } from '@/content/lessons';
import { METHODS, type MethodGroup } from '@/lib/sync/allowlist';

export type Category = 'mini-notation' | 'sound' | 'pitch' | 'level' | 'envelope' | 'filter' | 'effects' | 'space' | 'synth' | 'time' | 'signals' | 'structure' | 'tempo';

export interface RefEntry {
  /** Anchor id and display name, e.g. "lpf" or "*". */
  name: string;
  display: string;
  aliases?: string;
  takes: string;
  does: string;
  example: string;
  category: Category;
  caveat?: string;
}

const HAND: RefEntry[] = [
  // mini-notation
  { name: 'steps', display: '"a b c"', takes: 'mini-notation', does: 'Steps share one cycle (bar) equally.', example: 's("bd sd bd sd")', category: 'mini-notation' },
  { name: '~', display: '~', aliases: '-', takes: 'mini-notation', does: 'A rest: silence for one step.', example: 's("~ cp ~ cp")', category: 'mini-notation' },
  { name: '[ ]', display: '[ ]', takes: 'mini-notation', does: 'Squeeze several steps into one.', example: 's("bd [sd sd]")', category: 'mini-notation' },
  { name: '*', display: '*n', takes: 'number', does: 'Repeat a step n times inside its slot.', example: 's("bd*4")', category: 'mini-notation' },
  { name: '/', display: '/n', takes: 'number', does: 'Slow a step down: play it once every n cycles.', example: 's("bd cp/2")', category: 'mini-notation' },
  { name: '< >', display: '< >', takes: 'mini-notation', does: 'Pick one item per cycle, in turn.', example: 's("<bd cp>")', category: 'mini-notation' },
  { name: ',', display: 'a, b', takes: 'mini-notation', does: 'Play at the same time (chords, layers).', example: 'note("c3,eb3,g3")', category: 'mini-notation' },
  { name: '!', display: '!n', takes: 'number', does: 'Repeat a step without squeezing it.', example: 's("bd!3 ~")', category: 'mini-notation' },
  { name: '@', display: '@n', takes: 'number', does: 'Make a step n times longer.', example: 'note("c2@3 eb2")', category: 'mini-notation' },
  { name: '(k,n,rot)', display: '(k,n,rot)', takes: 'numbers', does: 'Euclidean rhythm: k hits spread over n steps, rotated.', example: 's("rim(3,8,1)")', category: 'mini-notation' },
  { name: '?', display: '?', takes: 'probability', does: 'Randomly drop the step (50%, or ?0.2 for 20%).', example: 's("hh*8?")', category: 'mini-notation' },
  { name: ':', display: 'a:n', takes: 'number', does: 'Pick variation n of a sound (0 is the first).', example: 's("bd:1 bd:2")', category: 'mini-notation' },
  { name: '{ }', display: '{ }%n', takes: 'mini-notation', does: 'Polymeter: steps keep their length and drift across bars.', example: 's("{bd sd hh}%4")', category: 'mini-notation' },
  // functions
  { name: 'note', display: 'note("…")', takes: 'note names or numbers', does: 'Play pitches: c2, eb3, f#1… (c3 = MIDI 48).', example: 'note("c2 eb2 g2").s("sawtooth")', category: 'pitch' },
  { name: 'chord', display: 'chord("…")', takes: 'chord names', does: 'Chord symbols in Strudel’s spelling: Cm7 (or C-7), Ab^7 for a major seventh (never maj7), G7. Add .voicing() or .rootNotes(o). A name it doesn’t know plays nothing.', example: 'chord("<Cm7 Fm7>").voicing()', category: 'pitch' },
  { name: 'rootNotes', display: '.rootNotes(octave)', takes: 'octave', does: 'The root of each chord, for basslines.', example: 'chord("<Cm7 Fm7>").rootNotes(2).s("sawtooth")', category: 'pitch' },
  { name: 'stack', display: 'stack(a, b, …)', takes: 'patterns', does: 'Play patterns at the same time.', example: 'stack(s("bd*4"), s("~ cp ~ cp"))', category: 'structure' },
  { name: 'arrange', display: 'arrange([bars, p], …)', takes: '[cycles, pattern] pairs', does: 'Play sections one after another; each restarts at its own bar 1.', example: 'arrange([2, s("bd*4")], [2, s("hh*8")])', category: 'structure' },
  { name: 'cat', display: 'cat(a, b, …)', takes: 'patterns', does: 'One pattern per cycle, in turn.', example: 'cat(s("bd*4"), s("bd*8"))', category: 'structure' },
  { name: 'lastOf', display: '.lastOf(n, f)', takes: 'n, function', aliases: 'firstOf / every', does: 'Apply f in the last cycle of every n.', example: 's("hh*4").lastOf(4, x => x.ply(2))', category: 'time' },
  { name: 'ply', display: '.ply(n)', takes: 'number', does: 'Repeat every event n times (fills, rolls).', example: 's("sd*4").ply(2)', category: 'time' },
  { name: 'fast', display: '.fast(n)', takes: 'number', aliases: 'slow', does: 'Speed the pattern up (or .slow(n) down).', example: 's("bd sd").fast(2)', category: 'time' },
  { name: 'rev', display: '.rev()', takes: '—', does: 'Play each cycle backwards.', example: 'note("c2 eb2 g2 bb2").rev().s("sawtooth")', category: 'time' },
  { name: 'off', display: '.off(t, f)', takes: 'time, function', does: 'Layer a shifted, changed copy (echo-like).', example: 's("cp").off(1/8, x => x.gain(.4))', category: 'time' },
  { name: 'degradeBy', display: '.degradeBy(p)', takes: '0–1', does: 'Drop a random share of events.', example: 's("hh*16").degradeBy(.3)', category: 'time' },
  { name: 'sometimesBy', display: '.sometimesBy(p, f)', takes: 'probability, function', aliases: 'sometimes, often, rarely', does: 'Apply f to a random share of events.', example: 's("rim*8").sometimesBy(.3, x => x.speed(2))', category: 'time' },
  { name: 'seed', display: '.seed(n)', takes: 'number', does: 'Choose a different (repeatable) random variation.', example: 's("hh*16").degradeBy(.3).seed(4)', category: 'time' },
  { name: 'mask', display: '.mask("1 0")', takes: 'mini-notation of 1/0', does: 'Silence the pattern where the mask is 0.', example: 's("hh*8").mask("<1 0>")', category: 'structure' },
  { name: 'struct', display: '.struct("x ~ x")', takes: 'mini-notation', does: 'Give a pattern a new rhythm.', example: 'note("c3,eb3,g3").struct("[~ x]*2")', category: 'structure' },
  { name: 'swingBy', display: '.swingBy(x, 8)', takes: 'amount, slices', does: 'Delay every second 16th. For p% MPC swing, x = (p − 50) / 50.', example: 's("hh*16").swingBy(.16, 8)', category: 'time' },
  { name: 'sine', display: 'sine, saw, tri, square', takes: 'signal 0–1', does: 'Smooth waves that move a value over time.', example: 'note("c2*8").s("sawtooth").lpf(sine.range(300, 2000).slow(4))', category: 'signals', caveat: 'Read once per note: use .seg(n) for held notes.' },
  { name: 'rand', display: 'rand, perlin', takes: 'signal 0–1', does: 'Random (rand) or smooth random (perlin) values.', example: 's("hh*16").gain(rand.range(.2, .6))', category: 'signals' },
  { name: 'range', display: '.range(min, max)', takes: 'numbers', does: 'Scale a 0–1 signal to min–max.', example: 'note("c2*8").s("sawtooth").lpf(saw.range(200, 3000))', category: 'signals' },
  { name: 'seg', display: '.seg(n)', aliases: 'segment', takes: 'number', does: 'Chop into n events per cycle so signals update.', example: 'note("c3").s("supersaw").seg(16).lpf(saw.range(300, 3000))', category: 'signals' },
  { name: 'setcpm', display: 'setcpm(BPM/4)', takes: 'cycles per minute', aliases: 'setcps', does: 'Set the tempo. With 4 beats per bar: setcpm(124/4) = 124 BPM.', example: 'setcpm(124/4)\ns("bd*4")', category: 'tempo' },
  { name: 'portamento', display: 'portamento / slide', takes: '—', does: 'Not available in Strudel’s synths (gap G1). Use .penv + .pattack to bend from the previous note.', example: 'note("c2 eb2").s("sawtooth").penv("0 3").pattack(.06)', category: 'synth', caveat: 'Missing feature' },
  { name: 'eq', display: 'EQ / master limiter', takes: '—', does: 'Not available (gap G6). Use .hpf/.lpf, .gain and ducking.', example: 's("oh*4").hpf(300)', category: 'effects', caveat: 'Missing feature' },
];

const GROUP_TO_CATEGORY: Record<MethodGroup, Category> = {
  sound: 'sound',
  pitch: 'pitch',
  level: 'level',
  envelope: 'envelope',
  filter: 'filter',
  fx: 'effects',
  space: 'space',
  synth: 'synth',
  time: 'time',
};

const EXAMPLE_BASE: Partial<Record<MethodGroup, string>> = {
  sound: 's("bd*4")',
  level: 's("hh*8")',
  space: 's("cp*2")',
  time: 's("hh*8")',
};

function exampleFor(method: string): string {
  const spec = METHODS[method];
  const base = EXAMPLE_BASE[spec.group] ?? 'note("c2*4").s("sawtooth")';
  if (method === 's') return 's("bd sd")';
  if (method === 'scale') return 'n("0 2 4 6").scale("C:minor").s("sawtooth")';
  if (method === 'voicing') return 'chord("Cm7").voicing()';
  if (method === 'n') return 's("bd*4").n("0 1 2 3")';
  if (method === 'duckorbit' || method === 'duckdepth' || method === 'duckattack') {
    return `stack(s("bd*4").duckorbit(2).duckdepth(.8).duckattack(.2), note("c2*8").s("sawtooth").orbit(2))`;
  }
  const v = spec.default;
  const arg = spec.arg === 'none' ? '' : typeof v === 'string' ? JSON.stringify(v) : v === undefined ? '' : String(v);
  return `${base}.${method}(${arg})`;
}

function rangeText(method: string): string {
  const s = METHODS[method];
  if (s.options) return s.options.join(' | ');
  if (s.min !== undefined && s.max !== undefined) return `${s.min}–${s.max}${s.log ? ' Hz' : ''}`;
  return s.arg;
}

const fromAllowlist: RefEntry[] = Object.keys(METHODS)
  .filter((m) => !HAND.some((h) => h.name === m))
  .map((m) => ({
    name: m,
    display: `.${m}(…)`,
    takes: rangeText(m),
    does: METHODS[m].label[0].toUpperCase() + METHODS[m].label.slice(1) + '.',
    example: exampleFor(m),
    category: GROUP_TO_CATEGORY[METHODS[m].group],
    caveat: METHODS[m].orbitWide ? 'One per orbit: parts sharing an orbit share this.' : undefined,
  }));

export const REFERENCE: RefEntry[] = [...HAND, ...fromAllowlist];

/** Lesson number where an entry is introduced, matched against lesson `introduces` lists. */
export function learnedIn(entry: RefEntry): number | undefined {
  const keys = [entry.name, `.${entry.name}`, entry.display];
  return lessons.find((l) => l.introduces.some((i) => keys.includes(i) || i.replace(/^\./, '') === entry.name))?.number;
}

export const CATEGORIES: Category[] = ['mini-notation', 'sound', 'pitch', 'level', 'envelope', 'filter', 'effects', 'space', 'synth', 'time', 'signals', 'structure', 'tempo'];
