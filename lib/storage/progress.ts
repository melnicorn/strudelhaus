import { KEYS, readJson, writeJson } from './kv';
import { progressSchema, settingsSchema, type LessonProgress, type Progress, type Settings } from './schema';

export function loadProgress(): Progress {
  return readJson(KEYS.progress, progressSchema, {});
}

export function saveProgress(progress: Progress): boolean {
  return writeJson(KEYS.progress, progress);
}

/** Merges an update into one lesson's progress. "done" is sticky once reached. */
export function updateLesson(progress: Progress, lessonId: string, update: Partial<LessonProgress>): Progress {
  const prev: LessonProgress = progress[lessonId] ?? {
    status: 'new',
    tasksPassed: [],
    challengePassed: false,
    manual: false,
    updatedAt: new Date().toISOString(),
  };
  const next: LessonProgress = { ...prev, ...update, updatedAt: new Date().toISOString() };
  if (prev.status === 'done' && update.status !== 'new') next.status = 'done';
  if (update.tasksPassed) next.tasksPassed = [...new Set([...prev.tasksPassed, ...update.tasksPassed])].sort((a, b) => a - b);
  if (prev.challengePassed) next.challengePassed = true;
  return { ...progress, [lessonId]: next };
}

/** Back to the starter code and no ticks. */
export function resetLesson(progress: Progress, lessonId: string): Progress {
  const { [lessonId]: _gone, ...rest } = progress;
  void _gone;
  return rest;
}

export function loadSettings(): Settings {
  return readJson(KEYS.settings, settingsSchema, settingsSchema.parse({}));
}

export function saveSettings(settings: Settings): boolean {
  return writeJson(KEYS.settings, settings);
}
