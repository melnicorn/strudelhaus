import { beforeEach, describe, expect, it } from 'vitest';
import { setBackend, KEYS, onStorageError } from '@/lib/storage/kv';
import {
  addItemToProject,
  exportData,
  itemFromBlock,
  loadLibrary,
  mergeImport,
  newProject,
  readImport,
  rekeyBlockMeta,
  saveLibrary,
  updatesAvailable,
  upsertItem,
} from '@/lib/storage/library';
import { loadProgress, loadSettings, resetLesson, saveProgress, saveSettings, updateLesson } from '@/lib/storage/progress';
import { evaluatePure } from '@/lib/strudel/pure';
import { parseProject } from '@/lib/sync/parseProject';

class MemoryStore {
  map = new Map<string, string>();
  getItem = (k: string) => this.map.get(k) ?? null;
  setItem = (k: string, v: string) => void this.map.set(k, v);
  removeItem = (k: string) => void this.map.delete(k);
}

const PROJECT = `setcpm(124/4)
const kick = s("bd*4").bank("RolandTR909")
const hats = s("[~ oh]*4").bank("RolandTR909")
const drums = stack(kick, hats)
drums
`;

let mem: MemoryStore;
beforeEach(() => {
  mem = new MemoryStore();
  setBackend(mem);
});

describe('library', () => {
  it('saves a block, loads it back, and versions edits', () => {
    const item = itemFromBlock(PROJECT, 'kick', { role: 'kick', tags: ['909'] })!;
    expect(item).toMatchObject({ kind: 'part', name: 'kick', code: 'const kick = s("bd*4").bank("RolandTR909")', version: 1 });
    saveLibrary([item]);
    expect(loadLibrary()).toEqual([item]);
    const edited = upsertItem([item], { ...item, code: 'const kick = s("bd*2").bank("RolandTR909")' });
    expect(edited[0].version).toBe(2);
    expect(upsertItem(edited, edited[0])[0].version).toBe(2); // unchanged code keeps the version
  });

  it('records dependencies for groups', () => {
    expect(itemFromBlock(PROJECT, 'drums')).toMatchObject({ kind: 'group', requires: ['kick', 'hats'] });
  });

  it('ignores corrupt or invalid stored data', () => {
    mem.setItem(KEYS.library, '{not json');
    expect(loadLibrary()).toEqual([]);
    mem.setItem(KEYS.library, JSON.stringify([{ id: 'x' }]));
    expect(loadLibrary()).toEqual([]);
  });

  it('reports when saving is impossible', () => {
    const messages: (string | null)[] = [];
    const off = onStorageError((m) => messages.push(m));
    setBackend({ getItem: () => null, setItem: () => { throw new Error('QuotaExceeded'); }, removeItem: () => {} });
    expect(saveLibrary([])).toBe(false);
    expect(messages.at(-1)).toMatch(/full/);
    off();
  });
});

describe('copying into projects (D2: copy with origin)', () => {
  it('inserts before the final statement, renames on clash, and still plays', async () => {
    const lib = itemFromBlock(PROJECT, 'kick')!;
    let p = newProject('Test', PROJECT);
    p = addItemToProject(p, lib);
    expect(p.code).toContain('const kick2 = s("bd*4").bank("RolandTR909")\ndrums\n');
    expect(p.blockMeta.kick2).toEqual({ libraryOrigin: { id: lib.id, version: 1 } });
    expect(parseProject(p.code).syntaxError).toBeUndefined();
    expect((await evaluatePure(p.code)).ok).toBe(true);
  });

  it('flags an update when the library version moves on', () => {
    const lib = itemFromBlock(PROJECT, 'kick')!;
    const p = addItemToProject(newProject('T', 'stack()'), lib);
    expect(updatesAvailable(p, [lib])).toEqual([]);
    const v2 = upsertItem([lib], { ...lib, code: 'const kick = s("bd*2")' });
    expect(updatesAvailable(p, v2).map((u) => [u.name, u.item.version])).toEqual([['kick', 2]]);
  });

  it('keeps metadata attached through a hand rename', () => {
    const lib = itemFromBlock(PROJECT, 'kick')!;
    const p = addItemToProject(newProject('T', 'stack()'), lib);
    const renamed = { ...p, code: p.code.replace('const kick', 'const bigKick') };
    expect(rekeyBlockMeta(renamed, p.code).blockMeta).toEqual({ bigKick: { libraryOrigin: { id: lib.id, version: 1 } } });
  });
});

describe('import / export', () => {
  it('round-trips and detects collisions and missing requirements', () => {
    const kick = itemFromBlock(PROJECT, 'kick')!;
    const drums = itemFromBlock(PROJECT, 'drums')!;
    const json = JSON.stringify(exportData([kick, drums]));
    const r = readImport(json, [kick]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.collisions).toEqual([kick.id]);
    expect(r.missingRequirements).toEqual([{ item: 'drums', missing: ['hats'] }]);
    expect(mergeImport([kick], r.file.items, 'skip')).toHaveLength(2);
    expect(mergeImport([kick], r.file.items, 'keep-both')).toHaveLength(3);
    expect(mergeImport([kick], r.file.items, 'replace')).toHaveLength(2);
  });

  it('rejects files that are not exports', () => {
    expect(readImport('nope', [])).toMatchObject({ ok: false });
    expect(readImport('{"format":"other"}', [])).toMatchObject({ ok: false });
  });
});

describe('progress', () => {
  it('merges ticks, keeps done sticky, and resets', () => {
    let p = updateLesson({}, 'l1', { status: 'started', tasksPassed: [0] });
    p = updateLesson(p, 'l1', { tasksPassed: [1] });
    expect(p.l1.tasksPassed).toEqual([0, 1]);
    p = updateLesson(p, 'l1', { status: 'done' });
    p = updateLesson(p, 'l1', { status: 'started', lastCode: 'x' });
    expect(p.l1.status).toBe('done');
    saveProgress(p);
    expect(loadProgress().l1.lastCode).toBe('x');
    expect(resetLesson(p, 'l1')).toEqual({});
  });
});

describe('settings', () => {
  beforeEach(() => setBackend(new MemoryStore()));

  it('defaults autocomplete on, and keeps an old saved shape', () => {
    expect(loadSettings().autocomplete).toBe(true);
    saveSettings({ autoPlayGuiEdits: false } as never); // saved before the setting existed
    expect(loadSettings()).toEqual({ autoPlayGuiEdits: false, autocomplete: true });
  });

  it('round-trips the setting', () => {
    saveSettings({ ...loadSettings(), autocomplete: false });
    expect(loadSettings().autocomplete).toBe(false);
  });
});
