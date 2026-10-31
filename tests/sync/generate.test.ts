import { describe, expect, it } from 'vitest';
import type { TextEdit } from '@/lib/editor/guiEdits';
import { evaluatePure, onsets } from '@/lib/strudel/pure';
import { applyTextEdits } from '@/lib/sync/applyText';
import {
  addMember,
  addMethod,
  addSection,
  moveArrangeRow,
  removeCall,
  removeMember,
  rewriteMember,
  setControl,
  setRootArg,
  setSectionBars,
  setTempo,
} from '@/lib/sync/generate';
import { gridToMini, parseGrid } from '@/lib/sync/miniGrid';
import type { PartBlock, StackBlock } from '@/lib/sync/model';
import { findBlock, parseProject } from '@/lib/sync/parseProject';

const BASE = `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const clap = s("~ cp ~ cp").bank("RolandTR909")
const hats = s("[~ oh]*4").bank("RolandTR909")
  .gain(.6)
const stab = note("[~ [c3,eb3,g3,bb3]]*2").s("sawtooth").decay(.12).sustain(0)
const dubDelay = x => x.delay(.4).delaysync(3/16).delayfeedback(.55).orbit(3)
const drums = stack(kick, clap, hats)
const intro = stack(kick, hats)
const drop = stack(drums, dubDelay(stab))
arrange(
  [16, intro],
  [32, drop],
)
`;

const part = (code: string, name: string) => findBlock(parseProject(code), name) as PartBlock;
const stack = (code: string, name: string) => findBlock(parseProject(code), name) as StackBlock;

/** Events of one cycle as sortable strings, for "only the intended events changed" checks. */
async function events(code: string, cycles = 1): Promise<string[]> {
  const r = await evaluatePure(code);
  if (!r.ok) throw new Error(r.message);
  return onsets(r.pattern, 0, cycles)
    .map((h) => `${h.whole!.begin.valueOf().toFixed(4)} ${JSON.stringify(h.value)}`)
    .sort();
}

/** Asserts the edit only touched its own ranges: every byte outside them is identical. */
function expectOnlyEdited(before: string, after: string, edits: TextEdit[]) {
  const sorted = [...edits].sort((a, b) => a.from - b.from);
  let pos = 0;
  let offset = 0;
  for (const e of sorted) {
    expect(after.slice(pos + offset, e.from + offset)).toBe(before.slice(pos, e.from));
    offset += e.insert.length - (e.to - e.from);
    pos = e.to;
  }
  expect(after.slice(pos + offset)).toBe(before.slice(pos));
}

function apply(code: string, edits: TextEdit[]) {
  expect(edits.length).toBeGreaterThan(0);
  const out = applyTextEdits(code, edits);
  expectOnlyEdited(code, out, edits);
  return out;
}

describe('part edits', () => {
  it('step grid: changes only the pattern string and the music matches the grid', async () => {
    const kick = part(BASE, 'kick');
    const steps = parseGrid(kick.root.arg.kind === 'string' ? kick.root.arg.value : '')!;
    steps[14] = 'bd';
    const out = apply(BASE, setRootArg(BASE, kick, gridToMini(steps)));
    expect(out).toContain('const kick = s("bd bd bd [bd bd]").bank("RolandTR909")');
    const before = await events(BASE);
    const after = await events(out);
    const added = after.filter((e) => !before.includes(e));
    expect(added).toHaveLength(1);
    expect(added[0]).toMatch(/^0\.8750 .*"s":"bd"/);
    expect(before.filter((e) => !after.includes(e))).toEqual([]);
  });

  it('slider: edits an existing number in place', async () => {
    const out = apply(BASE, setControl(BASE, part(BASE, 'hats'), 'gain', 0.45));
    expect(out).toContain('  .gain(.45)');
    expect(parseProject(out).blocks.length).toBe(parseProject(BASE).blocks.length);
  });

  it('add control: appends to the end of a multi-line chain', async () => {
    const out = apply(BASE, addMethod(BASE, part(BASE, 'hats'), 'hpf', 300));
    expect(out).toContain('  .gain(.6).hpf(300)\n');
    const evs = await events(out);
    // Strudel stores hpf under its canonical name, hcutoff.
    expect(evs.some((e) => e.includes('"oh"'))).toBe(true);
    expect(evs.every((e) => !e.includes('"oh"') || e.includes('"hcutoff":300'))).toBe(true);
  });

  it('add control: wraps onto a new line instead of growing a long one', () => {
    const code = 'const acid = note("c2 c2 c3 c2").s("sawtooth").ftype("ladder").lpf(500).lpq(18)\nacid';
    const out = apply(code, addMethod(code, part(code, 'acid'), 'lpdecay', 0.15));
    expect(out).toBe('const acid = note("c2 c2 c3 c2").s("sawtooth").ftype("ladder").lpf(500).lpq(18)\n  .lpdecay(.15)\nacid');
    expect(part(out, 'acid').chain.map((c) => c.method)).toContain('lpdecay');
  });

  it('remove control: removes a call on its own line cleanly', () => {
    const hats = part(BASE, 'hats');
    const out = apply(BASE, removeCall(BASE, hats.chain.find((c) => c.method === 'gain')!));
    expect(out).toContain('const hats = s("[~ oh]*4").bank("RolandTR909")\nconst stab');
  });

  it('does nothing to an uneditable control', () => {
    const code = 'const h = s("hh*8").gain(sine.range(.3,.7))\nh';
    expect(setControl(code, part(code, 'h'), 'gain', 0.5)).toEqual([]);
  });

  it('modifier: edits a value inside the arrow function', () => {
    const mod = findBlock(parseProject(BASE), 'dubDelay') as never;
    const out = apply(BASE, setControl(BASE, mod, 'delayfeedback', 0.7));
    expect(out).toContain('.delayfeedback(.7).orbit(3)');
  });
});

describe('anonymous final part', () => {
  it('edits a bare s(…) like a named part', async () => {
    const code = 'setcpm(124/4)\ns("bd")';
    const out = apply(code, addMethod(code, part(code, '$final'), 'bank', 'RolandTR909'));
    expect(out).toBe('setcpm(124/4)\ns("bd").bank("RolandTR909")');
    const out2 = apply(out, setRootArg(out, part(out, '$final'), 'bd*4'));
    expect(out2).toBe('setcpm(124/4)\ns("bd*4").bank("RolandTR909")');
    expect((await events(out2)).length).toBe(4);
  });
});

describe('tempo', () => {
  it('rewrites the bpm', () => {
    expect(apply(BASE, setTempo(parseProject(BASE), 128))).toMatch(/^setcpm\(128\/4\)\n/);
  });
  it('inserts setcpm when missing', () => {
    expect(applyTextEdits('s("bd")', setTempo(parseProject('s("bd")'), 120))).toBe('setcpm(120/4)\ns("bd")');
  });
});

describe('stack edits (groups and sections)', () => {
  it('adds, removes and wraps members', async () => {
    let code = apply(BASE, addMember(BASE, stack(BASE, 'intro'), 'clap'));
    expect(code).toContain('const intro = stack(kick, hats, clap)');
    code = apply(code, removeMember(code, stack(code, 'intro'), 0));
    expect(code).toContain('const intro = stack(hats, clap)');
    code = apply(code, removeMember(code, stack(code, 'intro'), 1));
    expect(code).toContain('const intro = stack(hats)');
    code = apply(code, removeMember(code, stack(code, 'intro'), 0));
    expect(code).toContain('const intro = stack()');
    code = apply(code, addMember(code, stack(code, 'intro'), 'kick'));
    expect(code).toContain('const intro = stack(kick)');
    const drop = stack(code, 'drop');
    code = apply(code, rewriteMember(code, drop.members[1], { wrappers: [] }));
    expect(code).toContain('const drop = stack(drums, stab)');
    code = apply(code, rewriteMember(code, stack(code, 'drums').members[1], { postgain: 0.8 }));
    expect(code).toContain('const drums = stack(kick, clap.postgain(.8), hats)');
    expect((await events(code)).length).toBeGreaterThan(0);
  });
});

describe('arrangement edits', () => {
  it('changes bars, reorders rows and adds a section', async () => {
    let code = apply(BASE, setSectionBars(BASE, parseProject(BASE), 0, 8));
    expect(code).toContain('[8, intro]');
    code = apply(code, moveArrangeRow(code, parseProject(code), 0, 1));
    expect(code).toContain('arrange(\n  [32, drop],\n  [8, intro],\n)');
    code = apply(code, addSection(code, parseProject(code), 'outro', 16));
    expect(code).toContain('const outro = stack()\n\narrange(');
    expect(code).toContain('[8, intro],\n  [16, outro],');
    const m = parseProject(code);
    expect(m.final?.kind === 'arrange' && m.final.rows.map((r) => r.section.name)).toEqual(['drop', 'intro', 'outro']);
    expect(findBlock(m, 'outro')?.kind).toBe('section');
  });

  it('plays sections for their bar counts', async () => {
    const code = 'const a = s("bd")\nconst b = s("sd")\narrange([2, a], [1, b])';
    const evs = await events(code, 3);
    expect(evs.map((e) => e.match(/"s":"(\w+)"/)![1])).toEqual(['bd', 'bd', 'sd']);
  });
});

describe('never rewrites hand-written code', () => {
  it('a GUI edit leaves every byte outside its range untouched, whatever else was hand-edited', () => {
    const handEdits = [
      (c: string) => c.replace('const clap', '// my clap\nconst   clap'),
      (c: string) => c.replace('.bank("RolandTR909")\n  .gain', ".bank('RolandTR909')   // quotes changed\n  .gain"),
      (c: string) => c.replace('const drums = stack(kick, clap, hats)', 'const drums = stack(kick, clap, hats).fast(2)'),
      (c: string) => c + '\n// trailing notes\nconst extra = cat(s("bd"), s("sd"))\n',
      (c: string) => c.replace('arrange(', '/* arrangement */ arrange('),
    ];
    // Every combination of hand edits, then every kind of GUI edit we support.
    for (let mask = 0; mask < 1 << handEdits.length; mask++) {
      let code = BASE;
      handEdits.forEach((f, i) => mask & (1 << i) && (code = f(code)));
      const model = parseProject(code);
      expect(model.syntaxError).toBeUndefined();
      const ops: TextEdit[][] = [
        setControl(code, findBlock(model, 'kick') as PartBlock, 'gain', 0.9),
        setRootArg(code, findBlock(model, 'clap') as PartBlock, '~ cp ~ [cp cp]'),
        setTempo(model, 130),
      ];
      const intro = findBlock(model, 'intro');
      if (intro?.kind === 'section') ops.push(addMember(code, intro, 'clap'));
      if (model.final?.kind === 'arrange') ops.push(setSectionBars(code, model, 1, 64));
      for (const edits of ops) apply(code, edits);
    }
  });

  it('refuses a stale edit, even when the edited range itself still matches', () => {
    const edits = setControl(BASE, part(BASE, 'hats'), 'gain', 0.3);
    const typed = BASE.replace('.gain(.6)', '.gain(.65)'); // ".6" is still at the same offset
    expect(() => applyTextEdits(typed, edits, BASE)).toThrow(/changed/);
    expect(() => applyTextEdits(BASE.replace('.6', '.7'), edits)).toThrow(/expected/);
  });
});
