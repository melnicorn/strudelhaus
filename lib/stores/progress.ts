import { create } from 'zustand';
import { loadProgress, resetLesson, saveProgress, updateLesson } from '@/lib/storage/progress';
import type { LessonProgress, Progress } from '@/lib/storage/schema';

interface ProgressStore {
  progress: Progress;
  loaded: boolean;
  load(): void;
  update(lessonId: string, update: Partial<LessonProgress>): void;
  reset(lessonId: string): void;
}

/** Lesson progress, persisted to localStorage (no backend). */
export const useProgressStore = create<ProgressStore>((set, get) => ({
  progress: {},
  loaded: false,
  load() {
    if (!get().loaded) set({ progress: loadProgress(), loaded: true });
  },
  update(lessonId, update) {
    const progress = updateLesson(get().progress, lessonId, update);
    set({ progress });
    saveProgress(progress);
  },
  reset(lessonId) {
    const progress = resetLesson(get().progress, lessonId);
    set({ progress });
    saveProgress(progress);
  },
}));
