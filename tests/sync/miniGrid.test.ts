import { describe, expect, it } from 'vitest';
import {
  formatNumber,
  gridToMini,
  isCanonicalGrid,
  numberSeqToMini,
  parseGrid,
  parseNumberSeq,
  stepsFromHaps,
  type Steps,
} from '@/lib/sync/miniGrid';
import { evaluatePure, onsets } from '@/lib/strudel/pure';

const grid = (on: number[], tok = 'bd'): Steps => Array.from({ length: 16 }, (_, i) => (on.includes(i) ? tok : null));

describe('gridToMini', () => {
  it.each([
    [[0, 4, 8, 12], 'bd*4'],
    [[2, 6, 10, 14], '[~ bd]*4'],
    [[], '~'],
    [[4, 12], '~ bd ~ bd'],
    [[0, 4, 8, 12, 14], 'bd bd bd [bd bd]'],
    [[0, 4, 8, 13], 'bd bd bd [~ bd ~ ~]'],
    [Array.from({ length: 16 }, (_, i) => i), '[bd bd bd bd]*4'],
  ])('%j → %s', (on, mini) => {
    expect(gridToMini(grid(on as number[]))).toBe(mini);
  });

  it('round-trips every single-hit and a random sample of grids', () => {
    for (let i = 0; i < 16; i++) expect(parseGrid(gridToMini(grid([i])))).toEqual(grid([i]));
    let seed = 7;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    for (let n = 0; n < 300; n++) {
      const steps: Steps = Array.from({ length: 16 }, () => (rand() < 0.3 ? (rand() < 0.5 ? 'bd' : 'sd') : null));
      const mini = gridToMini(steps);
      expect(parseGrid(mini)).toEqual(steps);
      expect(isCanonicalGrid(mini)).toBe(true);
    }
  });

  it('matches what Strudel actually plays (musical round trip)', async () => {
    for (const on of [[0, 4, 8, 12], [2, 6, 10, 14], [0, 3, 6, 9, 12, 14], [1, 5, 7, 15]]) {
      const steps = grid(on, 'hh');
      const r = await evaluatePure(`s("${gridToMini(steps)}")`);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const haps = onsets(r.pattern).map((h) => ({ begin: h.whole!.begin.valueOf(), end: h.whole!.end.valueOf(), token: String(h.value.s) }));
      expect(stepsFromHaps(haps)).toEqual(steps);
    }
  });
});

describe('parseGrid', () => {
  it('rejects non-canonical notation', () => {
    for (const s of ['bd(3,8)', '<bd sd>', 'bd!4', 'bd bd bd', 'bd@3 sd', '[bd sd sd]', 'bd*3', '[bd [sd sd]] ~ ~ ~']) {
      expect(parseGrid(s)).toBeNull();
    }
  });

  it('reads one- and two-step patterns as grids', () => {
    expect(parseGrid('bd')).toEqual(grid([0]));
    expect(parseGrid('bd sd')).toEqual([...grid([0]).slice(0, 8), 'sd', ...Array(7).fill(null)]);
    expect(parseGrid('~ cp')).toEqual(grid([8], 'cp'));
  });

  it('accepts hand-written canonical-ish forms and normalises them', () => {
    expect(parseGrid('bd ~ bd ~')).toEqual(grid([0, 8]));
    expect(isCanonicalGrid('bd ~ bd ~')).toBe(true);
    expect(isCanonicalGrid('[bd ~ ~ ~] ~ bd ~')).toBe(false); // valid grid, but not how we'd write it
  });
});

describe('stepsFromHaps', () => {
  it('refuses events between 16ths', async () => {
    const r = await evaluatePure('s("bd(3,8)")'); // 3,8 lands on 16ths: allowed
    expect(r.ok && stepsFromHaps(onsets(r.pattern).map((h) => ({ begin: h.whole!.begin.valueOf(), end: 0, token: 'bd' })))).toEqual(grid([0, 6, 12]));
    const t = await evaluatePure('s("bd*3")');
    expect(t.ok && stepsFromHaps(onsets(t.pattern).map((h) => ({ begin: h.whole!.begin.valueOf(), end: 0, token: 'bd' })))).toBeNull();
  });
});

describe('number sequences', () => {
  it('parses and writes', () => {
    expect(parseNumberSeq('[.6 .3 .9 .3]*4')).toEqual({ values: [0.6, 0.3, 0.9, 0.3], repeat: 4 });
    expect(parseNumberSeq('1 .5')).toEqual({ values: [1, 0.5], repeat: 1 });
    expect(parseNumberSeq('<1 .5>')).toBeNull();
    expect(numberSeqToMini({ values: [0.6, 0.3], repeat: 8 })).toBe('[.6 .3]*8');
    const sixteen = Array.from({ length: 16 }, (_, i) => (i === 1 ? 1 : 0.6));
    const grouped = numberSeqToMini({ values: sixteen, repeat: 1 });
    expect(grouped).toBe('[.6 1 .6 .6] [.6 .6 .6 .6] [.6 .6 .6 .6] [.6 .6 .6 .6]');
    expect(parseNumberSeq(grouped)).toEqual({ values: sixteen, repeat: 1 });
  });

  it('beat-grouped values play one per 16th', async () => {
    const values = Array.from({ length: 16 }, (_, i) => i / 10);
    const r = await evaluatePure(`s("hh*16").gain("${numberSeqToMini({ values, repeat: 1 })}")`);
    expect(r.ok && onsets(r.pattern).map((h) => h.value.gain)).toEqual(values);
  });

  it('formats numbers plainly', () => {
    expect([0.25, 1, -0.5, 0.33333, 124, 0.1 + 0.2].map(formatNumber)).toEqual(['.25', '1', '-.5', '.333', '124', '.3']);
  });
});
