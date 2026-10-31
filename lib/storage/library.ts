// The block library and saved projects. Pure functions over arrays plus load/save, so the
// logic is testable without a browser.
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { FINAL_PART } from '@/lib/sync/model';
import { parseProject } from '@/lib/sync/parseProject';
import { KEYS, readJson, writeJson } from './kv';
import {
  EXPORT_FORMAT,
  exportFileSchema,
  libraryItemSchema,
  projectSchema,
  type ExportFile,
  type LibraryItem,
  type Project,
} from './schema';

const now = () => new Date().toISOString();

export function loadLibrary(): LibraryItem[] {
  return readJson(KEYS.library, z.array(libraryItemSchema), []);
}
export function saveLibrary(items: LibraryItem[]): boolean {
  return writeJson(KEYS.library, items);
}
export function loadProjects(): Project[] {
  return readJson(KEYS.projects, z.array(projectSchema), []);
}
export function saveProjects(projects: Project[]): boolean {
  return writeJson(KEYS.projects, projects);
}

/** Builds a library item from one block of a project's code. */
export function itemFromBlock(
  code: string,
  name: string,
  extra: Partial<Pick<LibraryItem, 'role' | 'tags' | 'key' | 'bpmHint' | 'source'>> = {},
): LibraryItem | null {
  const model = parseProject(code);
  const block = model.blocks.find((b) => b.name === name);
  if (!block || block.kind === 'key' || name === FINAL_PART) return null;
  const kind = block.kind === 'custom' ? 'part' : block.kind;
  const requires =
    block.kind === 'group' || block.kind === 'section'
      ? [...new Set(block.members.flatMap((m) => [m.base, ...m.wrappers]))]
      : [];
  const t = now();
  return {
    id: nanoid(10),
    kind,
    name,
    code: code.slice(block.range.from, block.range.to),
    tags: [],
    requires,
    version: 1,
    createdAt: t,
    updatedAt: t,
    ...extra,
  };
}

/** Adds an item, or bumps the version of the item with the same id. */
export function upsertItem(items: LibraryItem[], item: LibraryItem): LibraryItem[] {
  const i = items.findIndex((x) => x.id === item.id);
  if (i < 0) return [...items, item];
  const prev = items[i];
  const next = { ...item, version: prev.code === item.code ? prev.version : prev.version + 1, createdAt: prev.createdAt, updatedAt: now() };
  return items.map((x, j) => (j === i ? next : x));
}

export function removeItem(items: LibraryItem[], id: string): LibraryItem[] {
  return items.filter((x) => x.id !== id);
}

export function newProject(name: string, code: string): Project {
  const t = now();
  return { id: nanoid(10), name, code, blockMeta: {}, createdAt: t, updatedAt: t };
}

/**
 * Copies a library item into project code (decision D2: copy with origin). Renames the copy if
 * the name is taken, inserts it before the final statement, and records where it came from.
 */
export function addItemToProject(project: Project, item: LibraryItem): Project {
  const model = parseProject(project.code);
  const taken = new Set(model.blocks.map((b) => b.name));
  let name = item.name;
  for (let n = 2; taken.has(name); n++) name = `${item.name}${n}`;
  const statement = name === item.name ? item.code : item.code.replace(/^(\s*const\s+)[A-Za-z_$][\w$]*/, `$1${name}`);
  const code = project.code;
  const at = model.final ? code.lastIndexOf('\n', model.final.range.from) + 1 : code.length;
  const sep = at === code.length && code && !code.endsWith('\n') ? '\n' : '';
  return {
    ...project,
    code: code.slice(0, at) + sep + statement + '\n' + code.slice(at),
    blockMeta: { ...project.blockMeta, [name]: { libraryOrigin: { id: item.id, version: item.version } } },
    updatedAt: now(),
  };
}

/** Project blocks whose library original has a newer version (the "update available" badge). */
export function updatesAvailable(project: Project, items: LibraryItem[]): { name: string; item: LibraryItem }[] {
  const out: { name: string; item: LibraryItem }[] = [];
  for (const [name, meta] of Object.entries(project.blockMeta)) {
    const origin = meta.libraryOrigin;
    const item = origin && items.find((x) => x.id === origin.id);
    if (item && item.version > origin.version) out.push({ name, item });
  }
  return out;
}

/**
 * Keeps sidecar metadata attached when a block is renamed by hand: if exactly one name
 * disappeared and exactly one appeared with an identical body, move the entry across.
 */
export function rekeyBlockMeta(project: Project, previousCode: string): Project {
  const before = parseProject(previousCode);
  const after = parseProject(project.code);
  if (before.syntaxError || after.syntaxError) return project;
  const body = (code: string, b: { initRange: { from: number; to: number } }) => code.slice(b.initRange.from, b.initRange.to);
  const oldNames = new Set(after.blocks.map((b) => b.name));
  const newNames = new Set(before.blocks.map((b) => b.name));
  const gone = before.blocks.filter((b) => !oldNames.has(b.name));
  const added = after.blocks.filter((b) => !newNames.has(b.name));
  if (gone.length !== 1 || added.length !== 1) return project;
  if (body(previousCode, gone[0]) !== body(project.code, added[0])) return project;
  const meta = project.blockMeta[gone[0].name];
  if (!meta) return project;
  const { [gone[0].name]: _moved, ...rest } = project.blockMeta;
  void _moved;
  return { ...project, blockMeta: { ...rest, [added[0].name]: meta } };
}

// ---------- import / export ----------

export function exportData(items: LibraryItem[], projects: Project[] = []): ExportFile {
  return { format: EXPORT_FORMAT, version: 1, exportedAt: now(), items, projects };
}

export type ImportResult =
  | { ok: true; file: ExportFile; collisions: string[]; missingRequirements: { item: string; missing: string[] }[] }
  | { ok: false; error: string };

/** Validates an export file and reports id collisions and missing dependencies. */
export function readImport(json: string, existing: LibraryItem[]): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: 'That file isn’t valid JSON.' };
  }
  const parsed = exportFileSchema.safeParse(data);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `That isn’t a Strudel Workshop export (${issue.path.join('.') || 'file'}: ${issue.message}).` };
  }
  const file = parsed.data;
  const ids = new Set(existing.map((x) => x.id));
  const names = new Set([...existing, ...file.items].map((x) => x.name));
  return {
    ok: true,
    file,
    collisions: file.items.filter((x) => ids.has(x.id)).map((x) => x.id),
    missingRequirements: file.items
      .map((x) => ({ item: x.name, missing: x.requires.filter((r) => !names.has(r)) }))
      .filter((x) => x.missing.length > 0),
  };
}

export type CollisionChoice = 'keep-both' | 'replace' | 'skip';

export function mergeImport(existing: LibraryItem[], incoming: LibraryItem[], choice: CollisionChoice): LibraryItem[] {
  let out = [...existing];
  for (const item of incoming) {
    const clash = out.some((x) => x.id === item.id);
    if (!clash) out.push(item);
    else if (choice === 'replace') out = out.map((x) => (x.id === item.id ? item : x));
    else if (choice === 'keep-both') out.push({ ...item, id: nanoid(10) });
  }
  return out;
}
