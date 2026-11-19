// Reads every style and shared sound recipe from content/ at build time (and in tests).
// Server only: pages pass the resolved style to client components as props. Adding a style is
// adding a file; nothing here or in the routes names one.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { corePack } from '@/lib/lessons/packs';
import { resolveSound } from './build';
import { archetypeSchema, styleSchema, type Archetype, type Style, type StyleConfig } from './types';

const CONTENT = path.join(process.cwd(), 'content');

function readAll<T>(dir: string, parse: (data: unknown, file: string) => T): [string, T][] {
  return readdirSync(path.join(CONTENT, dir))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => [f.replace(/\.json$/, ''), parse(JSON.parse(readFileSync(path.join(CONTENT, dir, f), 'utf8')), `content/${dir}/${f}`)]);
}

function check<T>(schema: { safeParse(data: unknown): { success: true; data: T } | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } } }) {
  return (data: unknown, file: string): T => {
    const result = schema.safeParse(data);
    if (result.success) return result.data;
    const issue = result.error.issues[0];
    throw new Error(`${file}: ${issue.path.join('.') || 'file'}: ${issue.message}`);
  };
}

/** Shared recipes, keyed by file name. */
export const archetypes: Record<string, Archetype> = Object.fromEntries(readAll('sounds', check<Archetype>(archetypeSchema)));

// Sounds link to core-curriculum lessons, whose runtime ids are their bare ids.
const lessonOf = (id: string) => {
  const lesson = corePack.lessons.find((l) => l.id === id);
  return lesson && { id: lesson.id, number: lesson.number, title: lesson.title };
};

function resolve(config: StyleConfig): Style {
  return { ...config, sounds: config.sounds.map((s) => resolveSound(s, archetypes, lessonOf)) };
}

/** Every style, in file-name order, with its sounds resolved. */
export const styles: Style[] = readAll('styles', check<StyleConfig>(styleSchema)).map(([, config]) => resolve(config));

const seen = new Set<string>();
for (const style of styles) {
  if (seen.has(style.id)) throw new Error(`Two styles in content/styles/ have the id "${style.id}".`);
  seen.add(style.id);
}

export function getStyle(id: string): Style | undefined {
  return styles.find((s) => s.id === id);
}
