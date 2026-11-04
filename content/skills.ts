// The skill map (docs/research.md §1) as data: what a learner can know, and what each skill needs
// first. Lessons say which skills they teach; the map opens a lesson once its skills' prerequisites
// are known. Packs may add skills of their own.
import type { SkillSpec } from '@/lib/lessons/types';

export type SkillTier = 'beginner' | 'intermediate' | 'expert';

export interface Skill extends SkillSpec {
  tier: SkillTier;
  requires: string[];
}

const B = (id: string, name: string, definition: string, requires: string[] = []): Skill => ({ id, tier: 'beginner', name, definition, requires });
const I = (id: string, name: string, definition: string, requires: string[] = []): Skill => ({ id, tier: 'intermediate', name, definition, requires });
const E = (id: string, name: string, definition: string, requires: string[] = []): Skill => ({ id, tier: 'expert', name, definition, requires });

export const SKILLS: Skill[] = [
  B('B1', 'Tempo / BPM', 'How fast the music goes, in beats per minute. House runs about 118–128 BPM; techno 120–140.'),
  B('B2', 'Beats and bars', 'A beat is one pulse; a bar is four of them. Songs are counted in bars.', ['B1']),
  B('B3', 'Subdivisions and the step grid', 'Splitting a beat into 2 (8ths) or 4 (16ths). A 16-step grid is one bar of 16ths.', ['B2']),
  B('B4', 'Four-on-the-floor', 'A kick on every beat of every bar.', ['B2']),
  B('B5', 'Kick, clap/snare, hats', 'The core kit: kick, clap or snare on 2 and 4, closed and open hats.', ['B4']),
  B('B6', 'Offbeats', 'Halfway between beats: the "and" in "1 and 2 and".', ['B3']),
  B('B7', 'Rests', 'Silence in a slot. Gaps matter as much as hits.', ['B3']),
  B('B8', 'Drum machine character', 'Each machine (808, 909, 707…) has its own sound and era.', ['B5']),
  B('B9', 'Layering parts', 'Several patterns at once make a groove.', ['B5']),
  B('B10', 'Volume and velocity', 'How loud a part is, and how hard each hit is.', ['B5']),
  B('B11', 'Notes and octaves', 'Pitches have letter names; the same letter 12 semitones up is an octave.'),
  B('B12', 'Simple bassline', 'A low, repeating pitched line that locks with the kick.', ['B4', 'B11']),
  B('B13', 'Samples vs synths', 'A sample plays a recording; a synth generates a tone from a waveform.'),
  B('B14', 'Low-pass filter and cutoff', 'Keeps the lows and cuts the highs above the cutoff: lower is darker.', ['B13']),

  I('I1', 'Swing / groove', 'Every second 16th a little late. 54–60% is a loose house shuffle.', ['B3']),
  I('I2', 'Syncopation', 'Accents in unexpected places, or resting on a strong beat.', ['B6']),
  I('I3', 'Euclidean and polyrhythms', 'N hits spread as evenly as possible over M steps; patterns of different lengths drifting.', ['I2']),
  I('I4', 'Ghost notes and dynamics', 'Quiet in-between hits and per-step accents.', ['B10']),
  I('I5', 'Scales and keys', 'The notes that belong together, with one home note. Minor keys dominate techno.', ['B11']),
  I('I6', 'Chords', 'Three or more notes at once. The minor 7th is the classic house chord.', ['I5']),
  I('I7', 'Chord progressions', 'A repeating sequence of chords over 4 or 8 bars.', ['I6']),
  I('I8', 'Bass vs kick', 'Both live in the lows; keep them out of each other’s way, or duck the bass.', ['B12']),
  I('I9', 'Oscillator waveforms', 'Sine, triangle, square, sawtooth: the raw tones a synth starts from.', ['B13']),
  I('I10', 'Envelopes (ADSR)', 'How a sound’s volume changes over time: attack, decay, sustain, release.', ['I9']),
  I('I11', 'Resonance', 'A boost at the cutoff that makes a filter squelch or whistle.', ['B14']),
  I('I12', 'High-pass and band-pass', 'High-pass removes lows; band-pass keeps a middle band.', ['B14']),
  I('I13', 'Filter envelope', 'An envelope that moves the cutoff on each note: the 303 "wow".', ['I10', 'I11']),
  I('I14', 'Reverb', 'A simulated room tail: further away, bigger.', ['B9']),
  I('I15', 'Delay / echo', 'Repeats synced to the tempo; dotted 8ths are classic.', ['B9']),
  I('I16', 'Distortion / saturation', 'Overdriving a sound for harmonics and grit.', ['I9']),
  I('I17', 'Panning', 'Left or right. Keep kick, bass and clap in the centre.', ['B9']),
  I('I18', 'LFO / modulation', 'A slow repeating wave that moves a setting by itself.', ['B14']),
  I('I19', 'Pattern variation', 'Change a loop every N bars: a fill, a dropped hit.', ['B9']),
  I('I20', 'Sound selection and tuning', 'Choosing samples and tuning kicks or basses to the key.', ['B8', 'I5']),

  E('E1', '303 acid line', 'A 16-step line with accents and slides.', ['I9', 'I10', 'I11', 'I12', 'I13']),
  E('E2', 'Filter sweeps over time', 'Cutoff or resonance moving over many bars.', ['I18']),
  E('E3', 'Phrasing (8/16/32 bars)', 'Changes land at the start of 8-, 16- or 32-bar blocks.', ['B2']),
  E('E4', 'Song sections', 'Intro, build, drop, breakdown, outro.', ['E3']),
  E('E5', 'Tension and release', 'Take things away, add risers and rolls, bring everything back.', ['E2', 'E4']),
  E('E6', 'Adding and removing layers', 'Parts enter and leave on phrase boundaries.', ['E3']),
  E('E7', 'DJ-friendly intro and outro', '16–32 bars of mostly drums at each end.', ['E4']),
  E('E8', 'Sidechain / ducking', 'Bass or pads dip when the kick hits: the pumping feel.', ['I8']),
  E('E9', 'Compression', 'Evening out loud and quiet for punch and glue.', ['B10']),
  E('E10', 'Gain staging and levels', 'Sensible levels so nothing clips and the kick stays on top.', ['B10']),
  E('E11', 'Frequency space', 'Each part gets its own range; cut what it doesn’t need.', ['I12']),
  E('E12', 'Effect buses', 'Several parts sharing one reverb or delay.', ['I14', 'I15']),
  E('E13', 'Probability and generative variation', 'Controlled randomness so a loop never repeats exactly.', ['I19']),
  E('E14', 'Complete arrangement', 'All of it, in a 5–7 minute track.', ['E4', 'E5', 'E10']),
];

export const SKILL_BY_ID: Record<string, Skill> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

/** Tags authors are encouraged to reuse, so search converges on the same words. */
export const SUGGESTED_TAGS = [
  // styles
  'house', 'deep house', 'chicago house', 'acid house', 'techno', 'detroit techno', 'dub techno', 'minimal', 'electro', 'garage', 'breakbeat', 'jungle', 'trance', 'hip hop', 'ambient',
  // material
  '808', '909', '707', '303', 'piano', 'organ', 'strings', 'pads', 'breaks', 'vocals',
  // technique
  'drums', 'bass', 'chords', 'melody', 'sound design', 'effects', 'mixing', 'arrangement', 'randomness', 'swing',
  // shape
  'project', 'track',
];

/** Every skill id a set of known skills implies, following prerequisites down (not up). */
export function closure(ids: Iterable<string>, extra: Record<string, SkillSpec> = {}): Set<string> {
  const out = new Set<string>();
  const visit = (id: string) => {
    if (out.has(id)) return;
    out.add(id);
    for (const r of (SKILL_BY_ID[id] ?? extra[id])?.requires ?? []) visit(r);
  };
  for (const id of ids) visit(id);
  return out;
}
