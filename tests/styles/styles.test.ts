import { describe, expect, it } from 'vitest';
import { applyVariation, buildCode, defaultState, soundLines, statuses, strippedState } from '@/lib/styles/build';
import { styles } from '@/lib/styles/load';
import type { Sound, SoundState, Style } from '@/lib/styles/types';
import { evaluatePure, onsets } from '@/lib/strudel/pure';
import { findMachine, SYNTHS } from '@/lib/sounds/catalog';

// What the engine can play without a drum machine: the synths, the default kit, and the built-in synth kick.
const UNBANKED = new Set([...SYNTHS.map((s) => s.sound), ...findMachine('')!.sounds.map(([s]) => s), 'sbd']);

/** The sound a note would play, when the engine has no such sound; undefined when it does. */
function missing(value: { s?: unknown; bank?: unknown }): string | undefined {
  if (typeof value.s !== 'string') return 'a note with no sound';
  if (typeof value.bank !== 'string') return UNBANKED.has(value.s) ? undefined : `s("${value.s}")`;
  return findMachine(value.bank)?.sounds.some(([s]) => s === value.s) ? undefined : `s("${value.s}").bank("${value.bank}")`;
}

/** The states worth hearing: everything on, the bare start, each step off alone, each variation. */
function statesOf(sound: Sound): [string, SoundState][] {
  const all = defaultState(sound);
  return [
    ['everything on', all],
    ['starting point only', strippedState(sound, all)],
    ...sound.ingredients.filter((i) => !i.required).map((i): [string, SoundState] => [`without ${i.id}`, { ...all, on: { ...all.on, [i.id]: false } }]),
    ...sound.variations.map((v): [string, SoundState] => [`variation ${v.name}`, applyVariation(sound, v)]),
  ];
}

const placeholders = (code = '') => [...code.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);

function checkStructure(style: Style, sound: Sound) {
  const ids = sound.ingredients.map((i) => i.id);
  expect(new Set(ids).size, 'ingredient ids are unique').toBe(ids.length);
  expect(sound.ingredients[0].required, 'the first ingredient is the starting point').toBe(true);
  const params = sound.ingredients.flatMap((i) => i.knobs.map((k) => k.param));
  expect(new Set(params).size, 'knob params are unique within the sound').toBe(params.length);
  const parts = new Set(style.context.map((p) => p.id));
  for (const part of Object.keys(sound.context)) expect(parts, `backing part "${part}"`).toContain(part);

  sound.ingredients.forEach((ing, n) => {
    const earlier = ids.slice(0, n);
    if (ing.needs) expect(earlier, `${ing.id} needs an earlier ingredient`).toContain(ing.needs);
    if (ing.replaces) expect(earlier, `${ing.id} replaces an earlier ingredient`).toContain(ing.replaces);
    expect(ing.required && (ing.needs || ing.replaces), `${ing.id}: a starting point stands alone`).toBeFalsy();
    expect(!!(ing.code || ing.pattern || ing.layer || ing.context || ing.required), `${ing.id} does something`).toBe(true);
    expect(ing.whole && !ing.code, `${ing.id}: "whole" is about its code`).toBeFalsy();
    for (const part of Object.keys(ing.context ?? {})) expect(parts, `${ing.id}: backing part "${part}"`).toContain(part);
    // Every {param} is filled by a knob of the sound, and every knob is used by its ingredient.
    const used = [...placeholders(ing.code), ...placeholders(ing.layer), ...Object.values(ing.context ?? {}).flatMap((c) => placeholders(c ?? ''))];
    for (const p of used) expect(params, `${ing.id} uses {${p}}`).toContain(p);
    for (const k of ing.knobs) expect(used, `${ing.id}: knob "${k.param}" is used in its code`).toContain(k.param);
  });
  for (const v of sound.variations) {
    for (const off of v.off ?? []) expect(ids, `variation ${v.name} switches off "${off}"`).toContain(off);
    for (const [param, value] of Object.entries(v.set ?? {})) {
      const knob = sound.ingredients.flatMap((i) => i.knobs).find((k) => k.param === param);
      expect(knob, `variation ${v.name} sets "${param}"`).toBeDefined();
      expect(value >= knob!.min && value <= knob!.max, `variation ${v.name}: ${param} is within the knob's range`).toBe(true);
    }
  }
}

describe('styles', () => {
  it('has at least one style, with unique sound ids', () => {
    expect(styles.length).toBeGreaterThan(0);
    for (const style of styles) expect(new Set(style.sounds.map((s) => s.id)).size, style.id).toBe(style.sounds.length);
  });

  it('stacks layers and puts whole-stack steps after them', () => {
    const sound = {
      ...styles[0].sounds[0],
      pattern: 's("hh*8")',
      ingredients: [
        { id: 'a', name: 'a', adds: '', required: true, code: '.gain({g})', knobs: [{ param: 'g', min: 0, max: 1, value: 0.5, sweet: [0, 1] as [number, number], below: '', above: '' }] },
        { id: 'b', name: 'b', adds: '', layer: 's("~ cp")', knobs: [] },
        { id: 'c', name: 'c', adds: '', code: '.swing(4)', whole: true, knobs: [] },
      ],
    };
    const all = defaultState(sound);
    expect(soundLines(sound, all).map((l) => l.text)).toEqual(['stack(', '  s("hh*8")', '    .gain(.5),', '  s("~ cp"),', ')', '  .swing(4)']);
    expect(soundLines(sound, { ...all, on: { ...all.on, b: false } }).map((l) => l.text)).toEqual(['s("hh*8")', '  .gain(.5)', '  .swing(4)']);
  });

  for (const style of styles) {
    describe(style.name, () => {
      it('backing loop evaluates', async () => {
        const r = await evaluatePure(`stack(${style.context.map((p) => p.code).join(',\n')})`);
        expect(r.ok, r.ok ? '' : r.message).toBe(true);
      });

      for (const sound of style.sounds) {
        describe(sound.name, () => {
          it('is well formed', () => checkStructure(style, sound));

          it('evaluates with any step switched off, alone and in context', async () => {
            for (const [label, state] of statesOf(sound)) {
              for (const inContext of [false, true]) {
                const { code } = buildCode(style, sound, state, inContext);
                const where = `${label}${inContext ? ', in context' : ''}:\n${code}`;
                expect(code, where).not.toMatch(/[{}]|undefined|NaN/);
                const r = await evaluatePure(code);
                if (!r.ok) throw new Error(`${r.message}\n${where}`);
                expect(r.cpm, where).toBe(style.tempo / 4);
                // Eight bars: risers, fills and impacts are that long.
                const haps = onsets(r.pattern, 0, 8);
                expect(haps.length, where).toBeGreaterThan(0);
                const absent = new Set(haps.map((h) => missing(h.value as { s?: unknown; bank?: unknown })).filter(Boolean));
                expect([...absent], `sounds the engine does not have, ${where}`).toEqual([]);
                // Ducking an orbit nothing plays on is a runtime error in Strudel.
                for (const [, orbit] of code.matchAll(/\.duckorbit\((\d+)\)/g)) expect(code, where).toContain(`.orbit(${orbit})`);
              }
            }
          });

          it('replaced and blocked steps leave the code', () => {
            const all = defaultState(sound);
            const status = statuses(sound, all);
            for (const ing of sound.ingredients) {
              if (ing.replaces) expect(status[ing.replaces], `${ing.id} replaces ${ing.replaces}`).toBe('replaced');
              if (ing.needs) expect(statuses(sound, { ...all, on: { ...all.on, [ing.needs]: false } })[ing.id]).toBe('blocked');
            }
          });
        });
      }
    });
  }
});
