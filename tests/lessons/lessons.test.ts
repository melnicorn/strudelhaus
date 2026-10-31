import { describe, expect, it } from 'vitest';
import { lessons } from '@/content/lessons';
import { buildContext } from '@/lib/lessons/checks';
import { parseProject } from '@/lib/sync/parseProject';

describe('lesson corpus', () => {
  it('has unique ids and numbers in order', () => {
    expect(new Set(lessons.map((l) => l.id)).size).toBe(lessons.length);
    lessons.forEach((l, i) => expect(l.number).toBe(i + 1));
  });

  for (const lesson of lessons) {
    describe(`${lesson.number}. ${lesson.title}`, () => {
      it('starter parses', () => {
        expect(parseProject(lesson.starter).syntaxError).toBeUndefined();
      });

      it('solution evaluates and passes every task', async () => {
        const r = await buildContext(lesson.solution);
        if ('error' in r) throw new Error(r.error);
        lesson.tasks.forEach((t, i) => t.replacedLater || expect(t.check(r.ctx), `task ${i + 1}: ${t.text}`).toBe(true));
      });

      it.runIf(!!lesson.challenge)('challenge has a passing answer', async () => {
        const r = await buildContext(lesson.challengeSolution ?? lesson.solution);
        if ('error' in r) throw new Error(r.error);
        expect(lesson.challenge!.check(r.ctx), lesson.challenge!.text).toBe(true);
      });

      it('starter does not already pass every task', async () => {
        const r = await buildContext(lesson.starter);
        if ('error' in r) return; // an empty starter is fine
        expect(lesson.tasks.every((t) => t.check(r.ctx))).toBe(false);
      });
    });
  }
});
