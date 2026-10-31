import { describe, expect, it } from 'vitest';
import { REFERENCE } from '@/lib/reference/entries';
import { evaluatePure, onsets } from '@/lib/strudel/pure';

describe('reference examples', () => {
  it('has unique names', () => {
    expect(new Set(REFERENCE.map((e) => e.name)).size).toBe(REFERENCE.length);
  });
  for (const entry of REFERENCE) {
    it(`${entry.display} example evaluates and plays something`, async () => {
      const r = await evaluatePure(entry.example);
      if (!r.ok) throw new Error(`${entry.example}: ${r.message}`);
      expect(onsets(r.pattern, 0, 4).length).toBeGreaterThan(0);
    });
  }
});
