import type { Lesson } from '@/lib/lessons/types';
import { beginner } from './beginner';
import { expert } from './expert';
import { intermediate } from './intermediate';

export const lessons: Lesson[] = [...beginner, ...intermediate, ...expert];

export function getLesson(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}

export function neighbours(id: string): { prev?: Lesson; next?: Lesson } {
  const i = lessons.findIndex((l) => l.id === id);
  return { prev: lessons[i - 1], next: lessons[i + 1] };
}

/**
 * Methods the GUI may offer in a lesson: everything introduced up to and including it.
 * Names like ".lpf" or "patterned .gain" map to the method "lpf" / "gain".
 */
export function allowedMethods(id: string): Set<string> {
  const i = lessons.findIndex((l) => l.id === id);
  const out = new Set<string>();
  for (const l of lessons.slice(0, i + 1)) {
    for (const name of l.introduces) {
      const m = /\.([A-Za-z]+)/.exec(name) ?? /^([a-z][A-Za-z]*)$/.exec(name);
      if (m) out.add(m[1]);
    }
  }
  return out;
}
