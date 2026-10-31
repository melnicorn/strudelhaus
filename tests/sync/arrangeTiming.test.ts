import { describe, expect, it } from 'vitest';
import { evaluatePure, onsets } from '@/lib/strudel/pure';

// design.md §7 risk 2: arrange() plays each section from its own cycle 0
// (it is stepcat of section.fast(bars), slowed by the total), so sweeps and fills line up with
// the start of their section wherever it falls in the song.
describe('arrange() section timing', () => {
  it('restarts each section at its own first bar', async () => {
    const r = await evaluatePure('const a = s("hh")\nconst b = s("<bd sd>")\narrange([1, a], [2, b])');
    if (!r.ok) throw new Error(r.message);
    expect(onsets(r.pattern, 0, 3).map((h) => h.value.s)).toEqual(['hh', 'bd', 'sd']);
  });

  it('runs a slow signal across exactly its section', async () => {
    const r = await evaluatePure(
      'const a = s("hh")\nconst build = s("bd").lpf(saw.range(0, 1600).slow(4))\narrange([3, a], [4, build])',
    );
    if (!r.ok) throw new Error(r.message);
    const cut = onsets(r.pattern, 3, 7).map((h) => h.value.cutoff);
    expect(cut).toEqual([0, 400, 800, 1200]);
  });
});
