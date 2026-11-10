import { describe, expect, it } from 'vitest';
import { applyVariation, buildCode, defaultState, statuses, strippedState } from '@/lib/styles/build';
import { styles } from '@/lib/styles/load';
import type { Sound, SoundState, Style } from '@/lib/styles/types';
import { evaluatePure, onsets } from '@/lib/strudel/pure';

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
    expect(!!(ing.code || ing.pattern || ing.context || ing.required), `${ing.id} does something`).toBe(true);
    for (const part of Object.keys(ing.context ?? {})) expect(parts, `${ing.id}: backing part "${part}"`).toContain(part);
    // Every {param} is filled by a knob of the sound, and every knob is used by its ingredient.
    const used = [...placeholders(ing.code), ...Object.values(ing.context ?? {}).flatMap((c) => placeholders(c ?? ''))];
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
                expect(onsets(r.pattern, 0, 1).length, where).toBeGreaterThan(0);
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
