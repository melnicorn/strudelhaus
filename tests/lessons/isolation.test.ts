// Each task ticks only when the learner does that task, so lessons build up one idea at a time.
// We walk a lesson the way a learner would: starter, then the code after each task (lesson.steps),
// then the solution, then the challenge. At every stage exactly the tasks done so far may pass.
import { describe, expect, it } from 'vitest';
import { lessons } from '@/content/lessons';
import { buildContext } from '@/lib/lessons/checks';
import type { CheckContext, Lesson, Task } from '@/lib/lessons/types';

const passes = (t: Task, ctx: CheckContext) => {
  try {
    return t.check(ctx);
  } catch {
    return false;
  }
};

/** The stages of a lesson: the code, and how many tasks are done by then. */
function stages(lesson: Lesson): { label: string; code: string; done: number }[] {
  return [
    { label: 'starter', code: lesson.starter, done: 0 },
    ...lesson.steps.map((code, i) => ({ label: `after task ${i + 1}`, code, done: i + 1 })),
    { label: 'solution', code: lesson.solution, done: lesson.tasks.length },
  ];
}

describe('lesson tasks are isolated', () => {
  for (const lesson of lessons) {
    describe(`${lesson.number}. ${lesson.title}`, () => {
      it('has a step for every task but the last', () => {
        expect(lesson.steps.length).toBe(lesson.tasks.length - 1);
      });

      it.runIf(!!lesson.challenge)('has a separate challenge solution', () => {
        expect(lesson.challengeSolution, 'challengeSolution').toBeDefined();
      });

      for (const { label, code, done } of stages(lesson)) {
        it(`${label}: only tasks 1–${done} pass, and not the challenge`, async () => {
          const r = await buildContext(code);
          if ('error' in r) {
            // An empty starter can't evaluate; anything later must.
            if (done === 0) return;
            throw new Error(r.error);
          }
          lesson.tasks.forEach((t, i) => {
            const n = i + 1;
            if (n > done) expect(passes(t, r.ctx), `task ${n} passes too early: ${t.text}`).toBe(false);
            // A task a later one replaces only has to hold at its own step.
            else if (n === done || !t.replacedLater) expect(passes(t, r.ctx), `task ${n} should pass: ${t.text}`).toBe(true);
          });
          if (lesson.challenge) expect(passes(lesson.challenge, r.ctx), `challenge passes too early: ${lesson.challenge.text}`).toBe(false);
        });
      }

      it.runIf(!!lesson.challengeSolution)('challenge solution builds on the solution: every task and the challenge pass', async () => {
        const r = await buildContext(lesson.challengeSolution!);
        if ('error' in r) throw new Error(r.error);
        lesson.tasks.forEach((t, i) => t.replacedLater || expect(passes(t, r.ctx), `task ${i + 1}: ${t.text}`).toBe(true));
        expect(passes(lesson.challenge!, r.ctx), lesson.challenge!.text).toBe(true);
      });
    });
  }
});
