// Checks the built-in lessons need that the check language doesn't express (mostly ones that
// walk an arrangement's sections). Only built-in packs may refer to these, by name.
import type { StrudelHap } from '@/lib/audio/engine';
import { arrangement, inBar, isNote, midiOf, numbersInBar, sectionStart, sound } from './checks';
import type { Customs } from './dsl';
import type { CheckContext } from './types';

const num = (v: unknown, fallback = NaN) => (v === undefined ? fallback : Number(v));
const hasKick = (c: CheckContext, bar: number) => inBar(c, bar, (h) => sound(h) === 'bd').length > 0;
const hasNotes = (c: CheckContext, bar: number) => inBar(c, bar, isNote).length > 0;
const isAcid = (h: StrudelHap) => isNote(h) && num(h.value.resonance, 0) >= 10;
/** First bar of each arrangement row. */
const rowStarts = (c: CheckContext) => arrangement(c).map((_, i) => sectionStart(c, i));

export const CORE_CUSTOMS: Customs = {
  /** Accented steps (velocity ≥ .9) are exactly the steps with the highest lpenv, and not every step is accented. */
  'accents-match-lpenv': (c) => {
    const evs = c.events().filter(isNote);
    const top = Math.max(...evs.map((h) => num(h.value.lpenv, 0)));
    return evs.every((h) => num(h.value.velocity, 1) >= 0.9 === (num(h.value.lpenv, 0) === top)) && evs.some((h) => num(h.value.lpenv, 0) < top);
  },
  /** At least two sections; the first is drums without notes; notes arrive in the second. */
  'intro-then-notes': (c) => {
    const rows = arrangement(c);
    return rows.length >= 2 && hasKick(c, 0) && !hasNotes(c, 0) && hasNotes(c, rowStarts(c)[1]);
  },
  /** At least three sections; the last is drums without notes. */
  'drum-outro': (c) => {
    const rows = arrangement(c);
    const last = rowStarts(c)[rows.length - 1];
    return rows.length >= 3 && hasKick(c, last) && !hasNotes(c, last);
  },
  /** Every section is a multiple of 4 bars, and some section of 32 bars or more has notes. */
  'phrased-sections': (c) => {
    const rows = arrangement(c);
    const starts = rowStarts(c);
    return rows.length >= 3 && rows.every((r) => r.bars > 0 && r.bars % 4 === 0) && rows.some((r, i) => r.bars >= 32 && hasNotes(c, starts[i]));
  },
  /** A section without a kick (a breakdown) is followed by one with the kick and notes (the drop). */
  'breakdown-into-drop': (c) => {
    const starts = rowStarts(c);
    return starts.some((s, i) => i < starts.length - 1 && !hasKick(c, s) && hasKick(c, starts[i + 1]) && hasNotes(c, starts[i + 1]));
  },
  /** In some section a noise part's high-pass rises by 1000 Hz or more from its first bar to its last. */
  'noise-riser': (c) =>
    rowStarts(c).some((s, i) => {
      const bars = arrangement(c)[i].bars;
      const noise = (h: StrudelHap) => ['pink', 'white', 'brown'].includes(sound(h));
      const a = numbersInBar(c, s, 'hcutoff', noise)[0];
      const b = numbersInBar(c, s + bars - 1, 'hcutoff', noise)[0];
      return a > 0 && b > a + 1000;
    }),
  /** The closed hats don't play the same number of hits in each of the first four bars. */
  'hats-vary-per-bar': (c) => new Set([0, 1, 2, 3].map((b) => inBar(c, b, (h) => sound(h) === 'hh').length)).size >= 2,
  /** The first and last sections are drums without notes. */
  'dj-intro-and-outro': (c) => {
    const starts = rowStarts(c);
    const first = starts[0];
    const last = starts[starts.length - 1];
    return starts.length > 1 && hasKick(c, first) && !hasNotes(c, first) && hasKick(c, last) && !hasNotes(c, last);
  },
  /** Some middle section drops the kick but keeps notes (a breakdown). */
  'has-breakdown': (c) => rowStarts(c).slice(1, -1).some((s) => !hasKick(c, s) && hasNotes(c, s)),
  /** At least two sections play the kick, the acid line and a bass note below midi 40 together. */
  'two-full-sections': (c) => {
    const starts = rowStarts(c);
    const full = starts.filter((s) => hasKick(c, s) && inBar(c, s, isAcid).length > 0 && inBar(c, s, (h) => isNote(h) && (midiOf(h) ?? 99) < 40).length > 0);
    return full.length >= 2 && arrangement(c).length >= 2;
  },
  /** Six or more sections, each a multiple of 4 bars, at least 96 bars in all. */
  'full-length-arrangement': (c) => {
    const rows = arrangement(c);
    return rows.length >= 6 && rows.every((r) => r.bars % 4 === 0) && rows.reduce((s, r) => s + r.bars, 0) >= 96;
  },
  /** In some section the acid line's cutoff at least doubles from the first bar to the last. */
  'acid-sweep-in-section': (c) => {
    const starts = rowStarts(c);
    const rows = arrangement(c);
    return starts.some((s, i) => {
      const a = numbersInBar(c, s, 'cutoff', isAcid)[0];
      const b = numbersInBar(c, s + rows[i].bars - 1, 'cutoff', isAcid)[0];
      return a > 0 && b > a * 2;
    });
  },
};
