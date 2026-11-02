import { describe, expect, it } from 'vitest';
import { applyBackup, makeBackup, readBackup, summarize, toCode, type SavedState } from '@/lib/storage/backup';
import { exportData } from '@/lib/storage/library';
import type { LessonProgress } from '@/lib/storage/schema';
import { settingsSchema } from '@/lib/storage/schema';

const lesson = (status: LessonProgress['status'], updatedAt: string, lastCode?: string): LessonProgress => ({
  status,
  tasksPassed: status === 'done' ? [0, 1] : [0],
  challengePassed: false,
  manual: false,
  lastCode,
  updatedAt,
});

const here: SavedState = {
  progress: { a: lesson('started', '2026-11-01T10:00:00.000Z', 'here a'), b: lesson('done', '2026-11-02T10:00:00.000Z', 'here b') },
  settings: settingsSchema.parse({ layout: 'stacked' }),
  items: [],
  projects: [],
};
const there: SavedState = {
  progress: { a: lesson('done', '2026-11-02T09:00:00.000Z', 'there a'), b: lesson('started', '2026-11-01T09:00:00.000Z'), c: lesson('started', '2026-11-01T09:00:00.000Z') },
  settings: settingsSchema.parse({}),
  items: [],
  projects: [],
};

describe('backup', () => {
  it('round-trips through a file and through a pasted code', async () => {
    const file = makeBackup(there);
    const fromFile = await readBackup(JSON.stringify(file, null, 2));
    const code = await toCode(file);
    expect(code).toMatch(/^sw1:[\w-]+$/);
    const fromCode = await readBackup(`  ${code}\n`);
    expect(fromFile).toEqual({ ok: true, file });
    expect(fromCode).toEqual({ ok: true, file });
  });

  it('rejects text that is not a backup, and damaged codes', async () => {
    expect(await readBackup('hello')).toMatchObject({ ok: false });
    expect(await readBackup('{"format":"other"}')).toMatchObject({ ok: false });
    const code = await toCode(makeBackup(there));
    expect(await readBackup(code.slice(0, code.length / 2))).toMatchObject({ ok: false, error: expect.stringMatching(/damaged/) });
  });

  it('accepts a library export as a backup with no progress', async () => {
    const r = await readBackup(JSON.stringify(exportData([])));
    expect(r).toMatchObject({ ok: true, file: { progress: {} } });
  });

  it('merge keeps the newer copy of each lesson and this computer’s settings', () => {
    const merged = applyBackup(here, makeBackup(there), 'merge');
    expect(merged.progress.a.lastCode).toBe('there a');
    expect(merged.progress.b.lastCode).toBe('here b');
    expect(Object.keys(merged.progress).sort()).toEqual(['a', 'b', 'c']);
    expect(merged.settings.layout).toBe('stacked');
  });

  it('replace takes everything from the file', () => {
    const replaced = applyBackup(here, makeBackup(there), 'replace');
    expect(replaced.progress).toEqual(there.progress);
    expect(replaced.settings.layout).toBe('side');
  });

  it('summarizes what a file holds and what a merge would keep', () => {
    expect(summarize(makeBackup(there), here)).toEqual({ lessons: 3, done: 1, items: 0, projects: 0, newerHere: 1 });
  });
});
