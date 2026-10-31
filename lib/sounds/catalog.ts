// What the sound browser lists: drum machines (from the generated sample manifests), synths and keys.
import { BANK_ALIASES, BANKS, DEFAULT_KIT } from './catalog.data';

/** Drum-machine sound names and what they are. */
export const DRUM_NAMES: Record<string, string> = {
  bd: 'kick',
  sd: 'snare',
  cp: 'clap',
  rim: 'rimshot',
  hh: 'closed hi-hat',
  oh: 'open hi-hat',
  lt: 'low tom',
  mt: 'mid tom',
  ht: 'high tom',
  cr: 'crash',
  rd: 'ride',
  cb: 'cowbell',
  sh: 'shaker',
  tb: 'tambourine',
  perc: 'percussion',
  misc: 'other',
  fx: 'effects',
  brk: 'breakbeat',
};

/** Order instruments are listed in: kit pieces first, extras last. */
const DRUM_ORDER = Object.keys(DRUM_NAMES);

/** "sd" → "sd - snare", "bd:2" → "bd:2 - kick". */
export function drumLabel(name: string): string {
  const full = DRUM_NAMES[name.split(':')[0]];
  return full ? `${name} - ${full}` : name;
}

/** The everyday kit pieces, for menus when a part's machine isn't known. */
export const KIT_PIECES = Object.keys(DRUM_NAMES).filter((s) => !['misc', 'fx', 'brk'].includes(s));

const MAKERS = ['Sequential Circuits', 'Soundmasters', 'Rhythm', 'Roland', 'Korg', 'Yamaha', 'Akai', 'Alesis', 'Boss', 'Casio', 'Doepfer', 'Emu', 'Linn', 'Moog', 'Oberheim', 'Rhodes', 'Sakata', 'Simmons', 'Univox', 'Visco', 'Xdrum', 'Serge', 'MFB'];

/** Hand-written notes for the machines that matter for 90s house and techno (★ in the browser). */
const CLASSICS: Record<string, { name: string; year: number; blurb: string }> = {
  RolandTR909: { name: 'Roland TR-909', year: 1983, blurb: 'The house and techno drum machine: punchy kick, crisp sampled hats and cymbals.' },
  RolandTR808: { name: 'Roland TR-808', year: 1980, blurb: 'Deep, boomy kick, snappy clap and the famous cowbell. All over Detroit techno and early house.' },
  RolandTR707: { name: 'Roland TR-707', year: 1985, blurb: 'Bright, tight sampled kit heard on many Chicago jack tracks.' },
  RolandTR606: { name: 'Roland TR-606', year: 1981, blurb: 'Thin, clicky analog kit, often paired with the TB-303 bassline.' },
  RolandTR727: { name: 'Roland TR-727', year: 1985, blurb: 'Latin percussion (congas, bongos, timbales) used for house percussion loops.' },
  KorgM1: { name: 'Korg M1', year: 1988, blurb: 'Workstation drums. The M1 also gave 90s house its organ bass and piano.' },
  AkaiMPC60: { name: 'Akai MPC60', year: 1988, blurb: 'Sampler with legendary swing; gritty 12-bit drums.' },
  EmuSP12: { name: 'E-mu SP-12', year: 1985, blurb: 'Crunchy 12-bit sampler drums.' },
  AlesisHR16: { name: 'Alesis HR-16', year: 1987, blurb: 'Cheap, clean sampled kit that turned up on lots of early house records.' },
};

export interface Machine {
  /** The text that goes in .bank("…"); empty for the default kit. */
  bank: string;
  name: string;
  year?: number;
  blurb?: string;
  classic: boolean;
  /** Instrument → variant count, in display order. */
  sounds: [string, number][];
}

function machineName(bank: string): string {
  const maker = MAKERS.find((m) => bank.startsWith(m.replace(/ /g, '')));
  const model = maker ? bank.slice(maker.replace(/ /g, '').length) : bank;
  const spaced = model.replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/^([A-Z]{2})(\d)/, '$1-$2');
  return maker ? `${maker === 'Emu' ? 'E-mu' : maker} ${spaced}`.trim() : spaced;
}

const ordered = (sounds: Record<string, number>): [string, number][] =>
  Object.entries(sounds).sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b));
const rank = (s: string) => (DRUM_ORDER.includes(s) ? DRUM_ORDER.indexOf(s) : DRUM_ORDER.length);

export const MACHINES: Machine[] = Object.entries(BANKS)
  .map(([bank, sounds]) => ({ ...CLASSICS[bank], bank, name: CLASSICS[bank]?.name ?? machineName(bank), classic: bank in CLASSICS, sounds: ordered(sounds) }))
  .sort((a, b) => Number(b.classic) - Number(a.classic) || (a.classic ? (a.year ?? 0) - (b.year ?? 0) : a.name.localeCompare(b.name)));

export const DEFAULT_MACHINE: Machine = {
  bank: '',
  name: 'Default kit',
  blurb: 'What plays when there is no .bank(): a mixed set of drums from many machines.',
  classic: true,
  sounds: ordered(DEFAULT_KIT),
};

/** Finds a machine by its bank name or alias, ignoring case (Strudel does too). */
export function findMachine(bank: string): Machine | undefined {
  const b = bank.toLowerCase();
  if (!b) return DEFAULT_MACHINE;
  const full = Object.entries(BANK_ALIASES).find(([, alias]) => alias.toLowerCase() === b)?.[0].toLowerCase() ?? b;
  return MACHINES.find((m) => m.bank.toLowerCase() === full);
}

export interface Synth {
  sound: string;
  blurb: string;
  kind: 'synth' | 'noise' | 'keys';
}

export const SYNTHS: Synth[] = [
  { sound: 'sawtooth', kind: 'synth', blurb: 'Buzzy and bright: acid lines, basses and big leads. Usually played through a low-pass filter (.lpf).' },
  { sound: 'square', kind: 'synth', blurb: 'Hollow and woody: organ-like basses and chiptune sounds.' },
  { sound: 'triangle', kind: 'synth', blurb: 'Soft, a little brighter than sine: sub basses and gentle pads.' },
  { sound: 'sine', kind: 'synth', blurb: 'A pure tone with no buzz: sub bass and 808-style booms.' },
  { sound: 'supersaw', kind: 'synth', blurb: 'Several slightly detuned saws at once: big rave and trance chords.' },
  { sound: 'pulse', kind: 'synth', blurb: 'A square wave with adjustable width: nasal, reedy leads.' },
  { sound: 'white', kind: 'noise', blurb: 'Bright hiss with no pitch: hats, risers and sweeps.' },
  { sound: 'pink', kind: 'noise', blurb: 'Softer, rounder hiss than white noise.' },
  { sound: 'brown', kind: 'noise', blurb: 'Deep rumble: wind and low washes.' },
  { sound: 'crackle', kind: 'noise', blurb: 'Random clicks, like an old vinyl record.' },
  { sound: 'piano', kind: 'keys', blurb: 'Sampled grand piano: the stabbed chords of 90s house piano.' },
];
