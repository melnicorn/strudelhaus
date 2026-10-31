import { describe, expect, it } from 'vitest';
import { findBlock, parseProject } from '@/lib/sync/parseProject';
import type { PartBlock, StackBlock } from '@/lib/sync/model';

const PROJECT = `// ── setup ─────
setcpm(124/4)            // 124 BPM
const key = "C:minor"

// ── parts ─────
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909").room(.25).orbit(2)
const hats = s("[~ oh]*4").bank("RolandTR909").gain("[.6 .3 .9 .3]*4")
  .sometimesBy(.2, x => x.speed(2))
const bass = n("[~ 0]*4").scale(key).s("sawtooth").octave(2)
  .lpf(500).decay(.15).sustain(0)
const loop = cat(s("hh*16"), s("hh*8"))

// ── modifiers ─────
const dubDelay = x => x.delay(.4).delaysync(3/16).delayfeedback(.55).orbit(3)
const weird = x => { return x.fast(2) }

// ── groups ─────
const drums = stack(kick, clap.postgain(.8), hats)
const bed = stack(bass, dubDelay(loop))

// ── sections ─────
const intro = stack(kick, hats)
const drop = stack(drums, bed)

arrange(
  [16, intro],
  [32, drop],
)
`;

describe('parseProject', () => {
  const m = parseProject(PROJECT);

  it('reads tempo and key', () => {
    expect(m.tempo).toMatchObject({ bpm: 124, status: 'gui' });
    expect(PROJECT.slice(m.tempo!.argRange.from, m.tempo!.argRange.to)).toBe('124/4');
    expect(findBlock(m, 'key')).toMatchObject({ kind: 'key', value: { value: 'C:minor' } });
  });

  it('reads a fully GUI part with exact ranges', () => {
    const kick = findBlock(m, 'kick') as PartBlock;
    expect(kick).toMatchObject({ kind: 'part', status: 'gui', root: { fn: 's', arg: { kind: 'string', value: 'bd*4' } } });
    expect(kick.chain.map((c) => c.method)).toEqual(['bank']);
    expect(PROJECT.slice(kick.root.arg.range.from, kick.root.arg.range.to)).toBe('"bd*4"');
    expect(PROJECT.slice(kick.chain[0].range.from, kick.chain[0].range.to)).toBe('.bank("RolandTR909")');
  });

  it('marks unknown methods as partial and locks the grid for structural ones', () => {
    const hats = findBlock(m, 'hats') as PartBlock;
    expect(hats.status).toBe('partial');
    expect(hats.structureLocked).toBe(true);
    expect(hats.chain.find((c) => c.method === 'gain')?.editable).toBe(true);
    expect(hats.chain.find((c) => c.method === 'sometimesBy')?.known).toBe(false);
  });

  it('marks a non-literal argument as uneditable but keeps the rest', () => {
    const bass = findBlock(m, 'bass') as PartBlock;
    expect(bass.status).toBe('partial'); // .scale(key) is a variable, not a literal
    expect(bass.chain.find((c) => c.method === 'scale')?.editable).toBe(false);
    expect(bass.chain.find((c) => c.method === 'lpf')?.editable).toBe(true);
    expect(bass.structureLocked).toBe(false);
  });

  it('treats an unknown root as a custom block', () => {
    expect(findBlock(m, 'loop')).toMatchObject({ kind: 'custom', status: 'custom' });
  });

  it('reads modifiers, and refuses ones it cannot model', () => {
    expect(findBlock(m, 'dubDelay')).toMatchObject({ kind: 'modifier', param: 'x', status: 'gui' });
    expect(findBlock(m, 'weird')).toMatchObject({ kind: 'custom' });
  });

  it('reads groups with wrapped members and classifies sections', () => {
    const drums = findBlock(m, 'drums') as StackBlock;
    expect(drums.kind).toBe('group');
    expect(drums.members.map((x) => [x.base, x.wrappers, x.postgain?.raw])).toEqual([
      ['kick', [], undefined],
      ['clap', [], '.8'],
      ['hats', [], undefined],
    ]);
    expect((findBlock(m, 'bed') as StackBlock).members[1]).toMatchObject({ base: 'loop', wrappers: ['dubDelay'] });
    expect(findBlock(m, 'intro')?.kind).toBe('section');
    expect(findBlock(m, 'drop')?.kind).toBe('section');
    expect(findBlock(m, 'drums')?.kind).toBe('group');
  });

  it('reads the arrangement', () => {
    expect(m.final?.kind).toBe('arrange');
    if (m.final?.kind !== 'arrange') return;
    expect(m.final.rows.map((r) => [r.bars.kind === 'number' && r.bars.value, r.section.name])).toEqual([
      [16, 'intro'],
      [32, 'drop'],
    ]);
  });

  it('reports a custom arrangement without affecting blocks', () => {
    const c = parseProject('const a = s("bd")\nconst b = s("sd")\n"<a b>".pick({a, b})');
    expect(c.final?.kind).toBe('custom');
    expect(findBlock(c, 'a')?.status).toBe('gui');
  });

  it('gives a bare final part chain its own anonymous block', () => {
    const m2 = parseProject('setcpm(124/4)\ns("bd*4").bank("RolandTR909")');
    expect(m2.final?.kind).toBe('part');
    expect(findBlock(m2, '$final')).toMatchObject({ kind: 'part', status: 'gui', root: { arg: { value: 'bd*4' } } });
    expect(parseProject('stack(s("bd"), s("cp"))').final?.kind).toBe('custom');
  });

  it('reports syntax errors with a line and no blocks', () => {
    const e = parseProject('const kick = s("bd*4"\nstack(kick)');
    expect(e.syntaxError?.line).toBe(2);
    expect(e.blocks).toEqual([]);
  });

  it('reads setcpm written as cycles per minute, and flags other tempo forms', () => {
    expect(parseProject('setcpm(31)\ns("bd")').tempo).toMatchObject({ bpm: 124, status: 'gui' });
    expect(parseProject('setcps(.5)\ns("bd")').tempo?.status).toBe('custom');
    expect(parseProject('setcpm(bpm/4)\ns("bd")').tempo?.status).toBe('custom');
  });
});
