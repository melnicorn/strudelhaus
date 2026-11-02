import { describe, expect, it } from 'vitest';
import { canVoice, chordProblem, chordSymbolsIn } from '@/lib/music/chords';
import { evaluatePure, onsets } from '@/lib/strudel/pure';
import { unvoiceableChords } from '@/lib/sync/diagnostics';
import { parseProject } from '@/lib/sync/parseProject';

describe('chord symbols', () => {
  it("knows Strudel's spellings and their aliases", () => {
    for (const s of ['Cm7', 'C-7', 'Ab^7', 'AbM7', 'G7', 'F#-7b5', 'Bbm7b5', 'Eo7', 'C+', 'Caug', 'C', 'Dsus', 'E7sus', 'C-^7']) {
      expect(canVoice(s), s).toBe(true);
    }
  });

  it('flags the spellings from other software, with the fix', () => {
    expect(chordProblem('Abmaj7')).toContain('Write Ab^7');
    expect(chordProblem('Cmaj9')).toContain('Write C^9');
    expect(chordProblem('Ddim7')).toContain('Write Do7');
    expect(chordProblem('Gsus4')).toContain('Write Gsus');
    expect(chordProblem('Cmin7')).toContain('Write C-7');
    expect(chordProblem('Cm7')).toBeNull();
    expect(chordProblem('xyz')).toContain("doesn't start with a note name");
  });

  it('matches what .voicing() actually plays', async () => {
    const r = await evaluatePure('chord("<Cm7 Abmaj7 Ab^7>").voicing().s("sawtooth")');
    if (!r.ok) throw new Error(r.message);
    const notesIn = (bar: number) => onsets(r.pattern, bar, bar + 1).length;
    expect(notesIn(0)).toBeGreaterThan(0);
    expect(notesIn(1)).toBe(0); // Abmaj7: silent, and no error
    expect(notesIn(2)).toBeGreaterThan(0);
  });

  it('reads the symbols out of a pattern string', () => {
    expect(chordSymbolsIn('<Cm7 Fm7 Ab^7 Gm7>')).toEqual(['Cm7', 'Fm7', 'Ab^7', 'Gm7']);
    expect(chordSymbolsIn('[Cm7 ~] <Fm7*2 G7@3>')).toEqual(['Cm7', 'Fm7', 'G7']);
    expect(chordSymbolsIn('Cm7')).toEqual(['Cm7']);
  });

  it('becomes a diagnostic on the chord part', () => {
    const m = parseProject('const stab = chord("<Cm7 Fm7 Abmaj7 Gm7>").voicing().s("sawtooth")\nstab');
    const d = unvoiceableChords(m);
    expect(d).toHaveLength(1);
    expect(d[0].blocks).toEqual(['stab']);
    expect(d[0].message).toContain('Abmaj7');
    expect(d[0].message).toContain('Ab^7');
    expect(unvoiceableChords(parseProject('const stab = chord("<Cm7 Ab^7>").voicing()\nstab'))).toEqual([]);
  });
});
