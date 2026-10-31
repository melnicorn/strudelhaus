// The methods the GUI understands, and how each argument is edited.
// Shared by the parser (what counts as GUI-editable), the panels (which control to draw)
// and the reference page. Ranges come from docs/research.md §3.

export type ArgKind =
  | 'number' // a single number literal
  | 'mini' // a mini-notation string (rhythms, notes)
  | 'mini-number' // a number, or a mini-notation string of numbers ("[.6 .3]*4")
  | 'enum' // one of a fixed set of strings
  | 'name' // a free string (bank name, scale name, sound)
  | 'none'; // no argument, e.g. .voicing()

export type MethodGroup = 'sound' | 'pitch' | 'level' | 'envelope' | 'filter' | 'fx' | 'space' | 'synth' | 'time';

export interface MethodSpec {
  arg: ArgKind;
  group: MethodGroup;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  /** Value written when the control is added from the "Add control" menu. */
  default?: number | string;
  options?: string[];
  /** Logarithmic slider (frequencies). */
  log?: boolean;
  /** Changes timing or structure, so a step grid can no longer show what plays. */
  structural?: boolean;
  /** Sets an orbit-wide (shared) effect; see gap G4. */
  orbitWide?: boolean;
}

export const ROOTS = ['s', 'sound', 'note', 'n', 'chord'] as const;
export type RootFn = (typeof ROOTS)[number];

export const METHODS: Record<string, MethodSpec> = {
  // sound selection
  s: { arg: 'name', group: 'sound', label: 'sound' },
  bank: {
    arg: 'name',
    group: 'sound',
    label: 'drum machine',
    options: ['RolandTR909', 'RolandTR808', 'RolandTR707', 'RolandTR606', 'RolandTR505', 'AkaiMPC60', 'EmuSP12', 'LinnDrum'],
    default: 'RolandTR909',
  },
  n: { arg: 'mini-number', group: 'sound', label: 'variant / degree', min: 0, max: 12, step: 1, default: 0 },
  speed: { arg: 'mini-number', group: 'sound', label: 'speed', min: 0.25, max: 4, step: 0.05, default: 1 },
  clip: { arg: 'mini-number', group: 'sound', label: 'length', min: 0.05, max: 2, step: 0.05, default: 1 },

  // pitch
  scale: { arg: 'name', group: 'pitch', label: 'scale', default: 'C:minor' },
  voicing: { arg: 'none', group: 'pitch', label: 'voicing' },
  octave: { arg: 'number', group: 'pitch', label: 'octave', min: 0, max: 7, step: 1, default: 3 },
  transpose: { arg: 'mini-number', group: 'pitch', label: 'transpose', min: -24, max: 24, step: 1, default: 0 },

  // level
  gain: { arg: 'mini-number', group: 'level', label: 'gain', min: 0, max: 1.5, step: 0.01, default: 0.8 },
  velocity: { arg: 'mini-number', group: 'level', label: 'velocity', min: 0, max: 1, step: 0.01, default: 1 },
  postgain: { arg: 'number', group: 'level', label: 'post gain', min: 0, max: 2, step: 0.01, default: 1 },
  pan: { arg: 'mini-number', group: 'level', label: 'pan', min: 0, max: 1, step: 0.01, default: 0.5 },

  // envelope
  attack: { arg: 'mini-number', group: 'envelope', label: 'attack', min: 0, max: 2, step: 0.005, default: 0.01 },
  decay: { arg: 'mini-number', group: 'envelope', label: 'decay', min: 0, max: 2, step: 0.005, default: 0.2 },
  sustain: { arg: 'mini-number', group: 'envelope', label: 'sustain', min: 0, max: 1, step: 0.01, default: 0.5 },
  release: { arg: 'mini-number', group: 'envelope', label: 'release', min: 0, max: 4, step: 0.01, default: 0.1 },

  // filter
  lpf: { arg: 'mini-number', group: 'filter', label: 'low-pass cutoff', min: 50, max: 18000, step: 1, log: true, default: 1200 },
  lpq: { arg: 'mini-number', group: 'filter', label: 'resonance', min: 0, max: 40, step: 0.5, default: 8 },
  hpf: { arg: 'mini-number', group: 'filter', label: 'high-pass cutoff', min: 20, max: 8000, step: 1, log: true, default: 200 },
  hpq: { arg: 'mini-number', group: 'filter', label: 'high-pass resonance', min: 0, max: 40, step: 0.5, default: 1 },
  bpf: { arg: 'mini-number', group: 'filter', label: 'band-pass', min: 50, max: 12000, step: 1, log: true, default: 1000 },
  ftype: { arg: 'enum', group: 'filter', label: 'filter type', options: ['12db', 'ladder', '24db'], default: 'ladder' },
  drive: { arg: 'number', group: 'filter', label: 'filter drive', min: 0, max: 10, step: 0.1, default: 1 },
  lpenv: { arg: 'mini-number', group: 'filter', label: 'filter envelope', min: -8, max: 8, step: 0.1, default: 4 },
  lpattack: { arg: 'number', group: 'filter', label: 'filter attack', min: 0, max: 1, step: 0.005, default: 0.01 },
  lpdecay: { arg: 'number', group: 'filter', label: 'filter decay', min: 0, max: 1, step: 0.005, default: 0.15 },
  lpsustain: { arg: 'number', group: 'filter', label: 'filter sustain', min: 0, max: 1, step: 0.01, default: 0 },
  lprelease: { arg: 'number', group: 'filter', label: 'filter release', min: 0, max: 2, step: 0.01, default: 0.1 },

  // per-voice fx
  distort: { arg: 'mini-number', group: 'fx', label: 'distortion', min: 0, max: 8, step: 0.1, default: 1 },
  crush: { arg: 'number', group: 'fx', label: 'bitcrush', min: 1, max: 16, step: 1, default: 8 },
  compressor: { arg: 'name', group: 'fx', label: 'compressor', default: '-20:20:10:.002:.02' },

  // shared space (per orbit)
  room: { arg: 'mini-number', group: 'space', label: 'reverb', min: 0, max: 1, step: 0.01, default: 0.3, orbitWide: true },
  roomsize: { arg: 'number', group: 'space', label: 'room size', min: 0, max: 10, step: 0.1, default: 2, orbitWide: true },
  delay: { arg: 'mini-number', group: 'space', label: 'delay', min: 0, max: 1, step: 0.01, default: 0.4, orbitWide: true },
  delaysync: { arg: 'number', group: 'space', label: 'delay time (cycles)', min: 1 / 16, max: 1, step: 1 / 16, default: 3 / 16, orbitWide: true },
  delayfeedback: { arg: 'number', group: 'space', label: 'feedback', min: 0, max: 0.95, step: 0.01, default: 0.5, orbitWide: true },
  orbit: { arg: 'number', group: 'space', label: 'orbit (effect bus)', min: 1, max: 12, step: 1, default: 2 },
  duckorbit: { arg: 'number', group: 'space', label: 'ducks orbit', min: 1, max: 12, step: 1, default: 2 },
  duckdepth: { arg: 'number', group: 'space', label: 'duck depth', min: 0, max: 1, step: 0.01, default: 0.8 },
  duckattack: { arg: 'number', group: 'space', label: 'duck recovery', min: 0, max: 1, step: 0.01, default: 0.2 },

  // synth
  unison: { arg: 'number', group: 'synth', label: 'unison voices', min: 1, max: 12, step: 1, default: 5 },
  spread: { arg: 'number', group: 'synth', label: 'stereo spread', min: 0, max: 1, step: 0.01, default: 0.6 },
  detune: { arg: 'number', group: 'synth', label: 'detune', min: 0, max: 1, step: 0.01, default: 0.18 },
  penv: { arg: 'mini-number', group: 'synth', label: 'pitch envelope (≈ slide)', min: -12, max: 12, step: 1, default: 0 },
  pattack: { arg: 'number', group: 'synth', label: 'pitch attack', min: 0, max: 0.5, step: 0.005, default: 0.05 },

  // time (structural: a step grid can't show their result)
  swingBy: { arg: 'name', group: 'time', label: 'swing', structural: true },
  struct: { arg: 'mini', group: 'time', label: 'rhythm', structural: true },
};

/** Not editable, but known to change timing: their presence makes step grids view-only. */
export const STRUCTURAL = new Set([
  'fast', 'slow', 'hurry', 'rev', 'palindrome', 'ply', 'segment', 'seg', 'early', 'late', 'inside', 'outside',
  'iter', 'iterBack', 'swing', 'swingBy', 'struct', 'mask', 'euclid', 'euclidRot', 'euclidLegato', 'off',
  'superimpose', 'layer', 'jux', 'juxBy', 'echo', 'stut', 'every', 'firstOf', 'lastOf', 'when', 'chunk',
  'sometimes', 'sometimesBy', 'often', 'rarely', 'almostNever', 'almostAlways', 'someCycles', 'someCyclesBy',
  'degrade', 'degradeBy', 'shuffle', 'scramble', 'linger', 'zoom', 'compress', 'within', 'pick', 'inhabit',
]);

export function isStructural(method: string): boolean {
  return STRUCTURAL.has(method) || !!METHODS[method]?.structural;
}
