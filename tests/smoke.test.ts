import { describe, expect, it } from 'vitest';
import { evaluatePure, onsets } from '@/lib/strudel/pure';

describe('evaluatePure', () => {
  it('evaluates project-style code and records tempo', async () => {
    const r = await evaluatePure('setcpm(124/4)\nconst kick = s("bd*4").bank("RolandTR909")\nstack(kick, s("~ cp ~ cp"))');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.cpm).toBe(31);
    const hits = onsets(r.pattern).map((h) => [h.whole!.begin.valueOf(), h.value.s]);
    expect(hits).toEqual([[0, 'bd'], [0.25, 'bd'], [0.25, 'cp'], [0.5, 'bd'], [0.75, 'bd'], [0.75, 'cp']]);
  });

  it('collects $: blocks', async () => {
    const r = await evaluatePure('$: s("bd*2")\n$: s("hh*4")\n_$: s("sd")');
    expect(r.ok && onsets(r.pattern).length).toBe(6);
  });

  it('reports syntax and mini errors with lines', async () => {
    const a = await evaluatePure('s("bd*4"');
    expect(a.ok).toBe(false);
    const b = await evaluatePure('\ns("bd [sd")');
    expect(b.ok === false && b.line).toBe(2);
  });

  it('handles scales and chords', async () => {
    const r = await evaluatePure('n("0 2 4").scale("C:minor").s("sawtooth")');
    expect(r.ok && onsets(r.pattern).map((h) => h.value.note)).toEqual(['C3', 'Eb3', 'G3']);
  });
});
