import { describe, expect, it } from 'vitest';
import { findTerms } from '@/lib/dictionary/match';
import { findTerm, TERMS, TERMS_BY_CODE, termId } from '@/lib/dictionary/terms';

const words = (text: string, seen?: Set<never>) => findTerms(text, seen).map((m) => text.slice(m.from, m.to));

describe('dictionary', () => {
  it('has unique terms and resolvable see-also links', () => {
    const ids = TERMS.map(termId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of TERMS) for (const s of t.seeAlso ?? []) expect(findTerm(s), `${t.term} → ${s}`).toBeDefined();
  });

  it('finds terms, longest phrase first, once each', () => {
    expect(words('An open hi-hat on the offbeat, then another hi-hat and the open hat again.')).toEqual(['open hi-hat', 'offbeat', 'hi-hat']);
    expect(words('A sawtooth through a low-pass filter with resonance')).toEqual(['sawtooth', 'low-pass filter', 'resonance']);
  });

  it('respects word boundaries and ambiguous words', () => {
    expect(words('Keys and keyboards; the hatchback; we drop out')).toEqual([]);
    expect(words('Stay in key for the drop')).toEqual(['in key', 'the drop']);
  });

  it('maps code to terms', () => {
    expect(TERMS_BY_CODE.get('lpf')?.term).toBe('low-pass filter');
    expect(TERMS_BY_CODE.get('sawtooth')?.term).toBe('sawtooth');
    expect(TERMS_BY_CODE.get('bd')?.term).toBe('kick');
  });
});

describe('code terms', async () => {
  const { findCodeTerms } = await import('@/lib/editor/terms');
  it('marks functions and sound names, not other strings', () => {
    const code = 'const kick = s("bd*4, hh*8").bank("RolandTR909")\nnote("c2 eb2").s("sawtooth").lpf(800) // lpf here';
    expect(findCodeTerms(code).map((t) => t.word)).toEqual(['s', 'bd', 'hh', 'bank', 'RolandTR909', 'note', 's', 'sawtooth', 'lpf']);
  });
});
