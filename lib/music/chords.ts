// Chord symbols Strudel's .voicing() understands, and help for the ones it silently doesn't.
// The dictionary is @strudel/tonal's "ireal" set: a major seventh is ^7 (or M7), a minor
// seventh -7 (or m7). A symbol it doesn't know plays nothing, with no error, so the lessons,
// the chord editor and the autocomplete all lean on this file.

/** Every quality in the ireal dictionary (what follows the root), in its own order. */
export const CHORD_QUALITIES = [
  '', '2', '5', '6', '7', '9', '11', '13', '69', 'add9', '+', 'o', 'h', 'sus', '^', '-', '^7', '-7', '7sus', 'h7', 'o7', '^9', '^13',
  '^7#11', '^9#11', '^7#5', '-6', '-69', '-^7', '-^9', '-9', '-add9', '-11', '-7b5', 'h9', '-b6', '-#5', '7b9', '7#9', '7#11', '7b5',
  '7#5', '9#11', '9b5', '9#5', '7b13', '7#9#5', '7#9b5', '7#9#11', '7b9#11', '7b9b5', '7b9#5', '7b9#9', '7b9b13', '7alt', '13#11',
  '13b9', '13#9', '7b9sus', '7susadd3', '9sus', '13sus', '7b13sus',
] as const;

/** The ones worth offering first, with what they mean. */
export const COMMON_QUALITIES: [string, string][] = [
  ['-7', 'minor 7th · the house chord (m7 works too)'],
  ['^7', 'major 7th (not maj7)'],
  ['7', 'dominant 7th'],
  ['-9', 'minor 9th'],
  ['^9', 'major 9th'],
  ['9', 'dominant 9th'],
  ['-', 'minor triad'],
  ['', 'major triad'],
  ['6', 'major 6th'],
  ['-6', 'minor 6th'],
  ['69', '6/9'],
  ['sus', 'suspended 4th'],
  ['7sus', '7 sus 4'],
  ['-7b5', 'half-diminished'],
  ['o7', 'diminished 7th'],
  ['+', 'augmented'],
  ['-^7', 'minor-major 7th'],
  ['add9', 'added 9th'],
];

/** The spellings Strudel also accepts: one "-"→"m", "^"→"M" or "+"→"aug" swap, as its alias code does. */
const ACCEPTED = new Set<string>();
for (const q of CHORD_QUALITIES) {
  ACCEPTED.add(q);
  if (q.includes('-')) ACCEPTED.add(q.replace('-', 'm'));
  if (q.includes('^')) ACCEPTED.add(q.replace('^', 'M'));
  if (q.includes('+')) ACCEPTED.add(q.replace('+', 'aug'));
}

/** Common spellings from other software, and what to write instead. */
const FIXES: [RegExp, string][] = [
  [/^maj7$/i, '^7'],
  [/^maj9$/i, '^9'],
  [/^maj13$/i, '^13'],
  [/^maj$/i, '^'],
  [/^(min|mi)7$/i, '-7'],
  [/^(min|mi)9$/i, '-9'],
  [/^(min|mi)$/i, '-'],
  [/^m(aj)?7b5$|^ø7?$/i, '-7b5'],
  [/^dim7$|^°7$/i, 'o7'],
  [/^dim$|^°$/i, 'o'],
  [/^mmaj7$|^minmaj7$|^m\^7$/i, '-^7'],
  [/^sus4$/i, 'sus'],
  [/^7sus4$/i, '7sus'],
  [/^9sus4$/i, '9sus'],
  [/^dom7$/i, '7'],
];

const ROOT = /^([A-Ga-g][#b]?)(.*)$/;

/** Splits "Abmaj7" into its root and quality, or null when it doesn't start with a note name. */
export function splitChord(symbol: string): { root: string; quality: string } | null {
  const m = ROOT.exec(symbol);
  return m ? { root: m[1], quality: m[2] } : null;
}

/** True when .voicing() knows this symbol. */
export function canVoice(symbol: string): boolean {
  const parts = splitChord(symbol);
  return !!parts && ACCEPTED.has(parts.quality);
}

/**
 * Why a chord symbol would play nothing, with the spelling to use instead when there is one,
 * or null when Strudel voices it fine.
 */
export function chordProblem(symbol: string): string | null {
  if (canVoice(symbol)) return null;
  const parts = splitChord(symbol);
  if (!parts) return `“${symbol}” doesn't start with a note name (C, Eb, F#…), so .voicing() plays nothing for it.`;
  const fix = FIXES.find(([re]) => re.test(parts.quality));
  const hint = fix ? `Write ${parts.root}${fix[1]}.` : 'Strudel writes a major seventh as ^7 and a minor seventh as -7 (or m7).';
  return `“${symbol}” isn't a chord name Strudel can voice, so .voicing() plays nothing for that bar. ${hint}`;
}

/** The chord symbols written in a chord("…") pattern string, in order, without rests or repeats. */
export function chordSymbolsIn(pattern: string): string[] {
  return pattern
    .replace(/[<>[\]{}()|,]/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/[*!@/]\S*$/, '').replace(/!+$/, ''))
    .filter((t) => t && t !== '~' && t !== '-' && !/^\d+$/.test(t));
}
