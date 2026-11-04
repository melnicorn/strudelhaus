import { describe, expect, it } from 'vitest';
import coreJson from '@/content/packs/core.json';
import { CORE_CUSTOMS } from '@/lib/lessons/custom';
import { compileCheck } from '@/lib/lessons/dsl';
import { buildContext } from '@/lib/lessons/checks';
import { validatePack } from '@/lib/lessons/validate';

const run = async (expr: unknown, code: string) => {
  const r = await buildContext(code);
  if ('error' in r) throw new Error(r.error);
  return compileCheck(expr)(r.ctx);
};

describe('check language', () => {
  const code = `setcpm(124/4)
const key = "C:minor"
const kick = s("bd*4").bank("RolandTR909").gain(.9)
const hats = s("[~ hh]*4").bank("RolandTR909").gain(.4)
const bass = n("[~ 0] [~ 2]").scale(key).s("sawtooth").octave(2).lpf(500)
stack(kick, hats, bass)`;

  it('queries events', async () => {
    expect(await run({ playsAt: { s: 'bd', at: [0, 0.25, 0.5, 0.75] } }, code)).toBe(true);
    expect(await run({ playsAt: { s: 'hh', at: [0, 0.25, 0.5, 0.75] } }, code)).toBe(false);
    expect(await run({ includesTimes: { s: 'hh', at: [0.125] } }, code)).toBe(true);
    expect(await run({ eq: [{ count: { s: 'bd' } }, 4] }, code)).toBe(true);
    expect(await run({ gt: [{ count: { s: 'bd', bar: 1 } }, { count: { s: 'hh', bar: 1 } }], }, code)).toBe(false);
    expect(await run({ every: { sel: { s: 'bd' }, where: [{ key: 'bank', eq: 'rolandtr909' }] } }, code)).toBe(true);
    expect(await run({ every: { sel: { s: 'sd' }, where: [{ key: 'bank', eq: 'rolandtr909' }] } }, code)).toBe(false);
    expect(await run({ some: { sel: { note: true }, where: [{ key: '$pc', eq: 3 }] } }, code)).toBe(true);
    expect(await run({ lt: [{ max: { sel: { s: 'hh' }, key: 'gain', default: 0.8 } }, { valueAt: { sel: { s: 'bd' }, key: 'gain' } }] }, code)).toBe(true);
  });

  it('reads the code and the model', async () => {
    expect(await run({ uses: 'scale' }, code)).toBe(true);
    expect(await run({ matches: 'scale\\(\\s*key\\s*\\)' }, code)).toBe(true);
    expect(await run({ defines: 'bass' }, code)).toBe(true);
    expect(await run({ block: { name: 'bass', kind: 'part' } }, code)).toBe(true);
    expect(await run({ final: 'stack' }, code)).toBe(true);
    expect(await run({ defined: { key: true } }, code)).toBe(true);
    expect(await run({ eq: [{ key: true }, 'c:minor'] }, code)).toBe(true);
    expect(await run({ inKey: {} }, code)).toBe(true);
    expect(await run({ inKey: { key: 'E:major' } }, code)).toBe(false);
    expect(await run({ all: [{ gte: [{ bpm: true }, 118] }, { lte: [{ bpm: true }, 128] }] }, code)).toBe(true);
    expect(await run({ not: { uses: 'arrange' } }, code)).toBe(true);
  });

  it('rejects what the schema does not know', () => {
    expect(() => compileCheck({ playAt: { s: 'bd', at: [0] } })).toThrow(/Invalid check/);
    expect(() => compileCheck({ every: { sel: { sound: 'bd' }, where: [] } })).toThrow(/Invalid check/);
    expect(() => compileCheck({ custom: 'nope' })).toThrow(/Unknown custom/);
  });
});

describe('validator', () => {
  it('passes the core pack', async () => {
    const r = await validatePack(coreJson, { builtin: true, customs: CORE_CUSTOMS });
    expect(r.findings.filter((f) => f.level === 'error')).toEqual([]);
  }, 60_000);

  const pack = (over: Record<string, unknown> = {}, lessonOver: Record<string, unknown> = {}) => ({
    format: 'strudel-workshop-pack',
    version: 1,
    id: 'test-pack',
    title: 'Test',
    description: '',
    tracks: [{ id: 't', title: 'T', blurb: '', kind: 'skills', lessons: ['a'] }],
    lessons: [
      {
        id: 'a',
        title: 'A',
        goal: 'g',
        concept: '',
        starter: 'setcpm(124/4)\ns("bd")',
        tasks: [
          { text: 'four kicks', hint: 'bd*4', check: { playsAt: { s: 'bd', at: [0, 0.25, 0.5, 0.75] } } },
          { text: 'add a clap', hint: 'stack', check: { playsAt: { s: 'cp', at: [0.25, 0.75] } } },
        ],
        steps: ['setcpm(124/4)\ns("bd*4")'],
        solution: 'setcpm(124/4)\nstack(s("bd*4"), s("~ cp ~ cp"))',
        summary: [],
        introduces: ['*'],
        teaches: ['B4'],
        ...lessonOver,
      },
    ],
    ...over,
  });

  it('accepts a sound community pack', async () => {
    const r = await validatePack(pack());
    expect(r.errors).toBe(0);
    expect(r.pack?.lessons[0].id).toBe('test-pack/a');
  });

  it('catches a loose check, a missing step and a custom check', async () => {
    const loose = await validatePack(pack({}, { tasks: [{ text: 'x', hint: 'x', check: { not: { uses: 'arrange' } } }], steps: [] }));
    expect(loose.findings.map((f) => f.message)).toContain('Passes with no music at all (the check is too loose)');

    const steps = await validatePack(pack({}, { steps: [] }));
    expect(steps.findings.some((f) => /Needs 1 step/.test(f.message))).toBe(true);

    const custom = await validatePack(pack({}, { tasks: [{ text: 'x', hint: 'x', check: { custom: 'dj-intro-and-outro' } }], steps: [] }));
    expect(custom.findings.some((f) => /community packs must use the check language/.test(f.message))).toBe(true);
  });

  it('catches a task that passes too early', async () => {
    const r = await validatePack(pack({}, { starter: 'setcpm(124/4)\ns("bd*4")' }));
    expect(r.findings.some((f) => /Task 1 passes too early/.test(f.message) && f.where === 'starter')).toBe(true);
  });

  it('walks a track line', async () => {
    const two = pack({ tracks: [{ id: 'line', title: 'L', blurb: '', kind: 'line', lessons: ['a', 'b'] }] });
    const b = {
      ...two.lessons[0],
      id: 'b',
      starter: 'setcpm(124/4)\nstack(s("bd*2"), s("~ cp ~ cp"))',
      tasks: [{ text: 'hats', hint: 'hh', check: { gte: [{ count: { s: 'hh' } }, 1] } }],
      steps: [],
      solution: 'setcpm(124/4)\nstack(s("bd*2"), s("~ cp ~ cp"), s("hh*8"))',
    };
    const r = await validatePack({ ...two, lessons: [two.lessons[0], b] });
    expect(r.findings.some((f) => /starter must be the previous lesson's solution/.test(f.message))).toBe(true);
    expect(r.findings.some((f) => /Undoes a task 1/.test(f.message))).toBe(true);
  });
});
