// A tiny localStorage wrapper. Every read and write is guarded: private windows, blocked site
// data and full quotas make localStorage throw, and the app must keep working (unsaved).
import type { z } from 'zod';

export interface KeyValue {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const KEYS = {
  library: 'sw:library:v1',
  projects: 'sw:projects:v1',
  progress: 'sw:progress:v1',
  settings: 'sw:settings:v1',
} as const;

let backend: KeyValue | null | undefined;
let lastError: string | null = null;
const errorListeners = new Set<(message: string | null) => void>();

function setError(message: string | null) {
  if (message === lastError) return;
  lastError = message;
  errorListeners.forEach((cb) => cb(message));
}

/** For tests, or to swap in another store. */
export function setBackend(kv: KeyValue | null) {
  backend = kv;
}

function store(): KeyValue | null {
  if (backend !== undefined) return backend;
  try {
    backend = typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    backend = null;
  }
  return backend;
}

/** Reads and validates a value; returns `fallback` if missing, unreadable or invalid. */
export function readJson<S extends z.ZodTypeAny>(key: string, schema: S, fallback: z.infer<S>): z.infer<S> {
  const kv = store();
  if (!kv) return fallback;
  try {
    const raw = kv.getItem(key);
    if (raw === null) return fallback;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  const kv = store();
  if (!kv) {
    setError('Your browser isn’t letting this site save, so changes won’t be kept.');
    return false;
  }
  try {
    kv.setItem(key, JSON.stringify(value));
    setError(null);
    return true;
  } catch {
    setError('Saving failed: browser storage may be full. Export your library to keep a copy.');
    return false;
  }
}

/** Subscribe to storage problems (for a visible banner). */
export function onStorageError(cb: (message: string | null) => void): () => void {
  errorListeners.add(cb);
  cb(lastError);
  return () => errorListeners.delete(cb);
}
