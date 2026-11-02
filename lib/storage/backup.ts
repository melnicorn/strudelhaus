// Moving everything this browser keeps (progress, settings, library, projects) to another
// computer, as a JSON file or a one-line code. Pure functions plus load/save, like library.ts.
import { loadLibrary, loadProjects, saveLibrary, saveProjects } from './library';
import { loadProgress, loadSettings, saveProgress, saveSettings } from './progress';
import {
  BACKUP_FORMAT,
  backupFileSchema,
  exportFileSchema,
  type BackupFile,
  type LibraryItem,
  type Progress,
  type Project,
  type Settings,
} from './schema';

export interface SavedState {
  progress: Progress;
  settings: Settings;
  items: LibraryItem[];
  projects: Project[];
}

export type BackupMode = 'merge' | 'replace';

const CODE_PREFIX = 'sw1:';

export function loadState(): SavedState {
  return { progress: loadProgress(), settings: loadSettings(), items: loadLibrary(), projects: loadProjects() };
}

export function saveState(s: SavedState): boolean {
  return [saveProgress(s.progress), saveSettings(s.settings), saveLibrary(s.items), saveProjects(s.projects)].every(Boolean);
}

export function makeBackup(s: SavedState): BackupFile {
  return { format: BACKUP_FORMAT, version: 1, exportedAt: new Date().toISOString(), ...s };
}

// ---------- the one-line code: deflate, then base64url ----------

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function toCode(file: BackupFile): Promise<string> {
  const packed = await pipe(new TextEncoder().encode(JSON.stringify(file)), new CompressionStream('deflate-raw'));
  let bin = '';
  for (const b of packed) bin += String.fromCharCode(b);
  return CODE_PREFIX + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function fromCode(code: string): Promise<string> {
  const b64 = code.slice(CODE_PREFIX.length).replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(await pipe(bytes, new DecompressionStream('deflate-raw')));
}

// ---------- reading ----------

export type ReadBackupResult = { ok: true; file: BackupFile } | { ok: false; error: string };

const NOT_A_BACKUP = 'That isn’t a Strudel Workshop progress file or code.';

/** Accepts a backup file's text, a pasted code, or a library export (which has no progress). */
export async function readBackup(text: string): Promise<ReadBackupResult> {
  const t = text.trim();
  let data: unknown;
  try {
    data = JSON.parse(t.startsWith(CODE_PREFIX) ? await fromCode(t) : t);
  } catch {
    return { ok: false, error: t.startsWith(CODE_PREFIX) ? 'That code is incomplete or damaged: copy it again.' : NOT_A_BACKUP };
  }
  const backup = backupFileSchema.safeParse(data);
  if (backup.success) return { ok: true, file: backup.data };
  const library = exportFileSchema.safeParse(data);
  if (library.success) {
    const { exportedAt, items, projects } = library.data;
    return { ok: true, file: { format: BACKUP_FORMAT, version: 1, exportedAt, progress: {}, items, projects } };
  }
  return { ok: false, error: NOT_A_BACKUP };
}

// ---------- applying ----------

/** By id, the newer `updatedAt` wins. */
function newerById<T extends { id: string; updatedAt: string }>(here: T[], incoming: T[]): T[] {
  const out = new Map(here.map((x) => [x.id, x]));
  for (const x of incoming) {
    const mine = out.get(x.id);
    if (!mine || x.updatedAt > mine.updatedAt) out.set(x.id, x);
  }
  return [...out.values()];
}

/**
 * Merge keeps whichever copy of each lesson, block and project is newer, and keeps this
 * computer's settings. Replace swaps everything for the file's contents.
 */
export function applyBackup(here: SavedState, file: BackupFile, mode: BackupMode): SavedState {
  if (mode === 'replace') return { progress: file.progress, settings: file.settings ?? here.settings, items: file.items, projects: file.projects };
  const progress = { ...here.progress };
  for (const [id, p] of Object.entries(file.progress)) if (!progress[id] || p.updatedAt > progress[id].updatedAt) progress[id] = p;
  return { progress, settings: here.settings, items: newerById(here.items, file.items), projects: newerById(here.projects, file.projects) };
}

export interface BackupSummary {
  lessons: number;
  done: number;
  items: number;
  projects: number;
  /** Lessons where this computer's copy is newer than the file's (a merge keeps them). */
  newerHere: number;
}

export function summarize(file: BackupFile, here?: SavedState): BackupSummary {
  const entries = Object.entries(file.progress);
  return {
    lessons: entries.length,
    done: entries.filter(([, p]) => p.status === 'done').length,
    items: file.items.length,
    projects: file.projects.length,
    newerHere: here ? entries.filter(([id, p]) => here.progress[id] && here.progress[id].updatedAt > p.updatedAt).length : 0,
  };
}
