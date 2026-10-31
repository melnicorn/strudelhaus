// Note-name helpers for pitched step sequencers. Strudel's convention: c3 = MIDI 48, a4 = 69.

const PITCH: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

/** "c2", "eb2", "f#3", "C3" → MIDI number; null if it isn't a note name. */
export function noteToMidi(name: string): number | null {
  const m = /^([a-gA-G])(#|b|s|f)?(-?\d+)$/.exec(name.trim());
  if (!m) return null;
  const acc = m[2] === '#' || m[2] === 's' ? 1 : m[2] === 'b' || m[2] === 'f' ? -1 : 0;
  return PITCH[m[1].toLowerCase()] + acc + (Number(m[3]) + 1) * 12;
}

const NAMES = ['c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b'];

export function midiToNote(midi: number): string {
  return `${NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

/** Note names for a picker: `low`..`high` inclusive (default c1..c4). */
export function noteRange(low = 24, high = 60): string[] {
  return Array.from({ length: high - low + 1 }, (_, i) => midiToNote(low + i));
}

/**
 * Pitch-envelope amounts that make each slid note start at the previous note's pitch and glide
 * to its own (see docs/research.md gap G1: Strudel has no real portamento). With the default
 * pitch envelope, a note starts `penv` semitones *below* itself, so penv = this − previous.
 */
export function slideAmounts(notes: (string | null)[], slides: boolean[]): number[] {
  let prev: number | null = null;
  return notes.map((n, i) => {
    const midi = n ? noteToMidi(n) : null;
    const amount = slides[i] && midi !== null && prev !== null ? midi - prev : 0;
    if (midi !== null) prev = midi;
    return amount;
  });
}

/** Expands a number sequence to `length` steps (a 4-value pattern repeated 4×, etc.). */
export function expandTo(values: number[], repeat: number, length = 16): number[] | null {
  const total = values.length * repeat;
  if (length % total !== 0 && total !== length) return null;
  const once = Array.from({ length: total }, (_, i) => values[i % values.length]);
  return Array.from({ length }, (_, i) => once[i % total]);
}

/** Writes 16 values as compactly as possible: shortest repeating unit, "[…]*n". */
export function compactSequence(values: number[]): { values: number[]; repeat: number } {
  for (const period of [1, 2, 4, 8]) {
    if (values.every((v, i) => v === values[i % period])) {
      return { values: values.slice(0, period), repeat: values.length / period };
    }
  }
  return { values, repeat: 1 };
}
