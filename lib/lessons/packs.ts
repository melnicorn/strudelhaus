// Lesson packs: JSON specs compiled into runtime lessons (checks become predicates, ids are
// qualified, tracks are resolved). The core pack ships with the site; more packs are fetched or
// imported at runtime and registered here. Nothing in the app reads a lesson except through this.
import coreJson from '@/content/packs/core.json';
import { SKILL_BY_ID, closure, type Skill } from '@/content/skills';
import type { Progress } from '@/lib/storage/schema';
import { CORE_CUSTOMS } from './custom';
import { compileCheck, type Customs } from './dsl';
import type { Lesson, LessonSpec, Pack, PackSpec, SkillSpec, Task, TaskSpec, Tier, Track } from './types';

export const CORE_PACK_ID = 'core';

/** The runtime id of a lesson: the core pack keeps bare ids (URLs and saved progress use them). */
export function qualify(packId: string, localId: string): string {
  return packId === CORE_PACK_ID ? localId : `${packId}/${localId}`;
}

const TIER_RANK: Record<Tier, number> = { beginner: 0, intermediate: 1, expert: 2 };

function tierOf(teaches: string[], extra: Record<string, SkillSpec>): Tier {
  let best: Tier = 'beginner';
  for (const id of teaches) {
    const t = SKILL_BY_ID[id]?.tier ?? (extra[id] ? 'intermediate' : undefined);
    if (t && TIER_RANK[t] > TIER_RANK[best]) best = t;
  }
  return best;
}

function named<T>(where: string, fn: () => T): T {
  try {
    return fn();
  } catch (e) {
    throw new Error(`${where}: ${(e as Error).message}`);
  }
}

function compileTask(t: TaskSpec, customs: Customs): Task {
  return { text: t.text, hint: t.hint, check: compileCheck(t.check, customs), ...(t.replacedLater ? { replacedLater: true } : {}) };
}

/** Prerequisites of what a lesson teaches, less what it teaches itself. */
export function defaultRequires(spec: LessonSpec, extra: Record<string, SkillSpec> = {}): string[] {
  const own = new Set(spec.teaches);
  const req = new Set<string>();
  for (const id of spec.teaches) for (const r of (SKILL_BY_ID[id] ?? extra[id])?.requires ?? []) if (!own.has(r)) req.add(r);
  return [...req];
}

/**
 * Compiles a pack. Throws if a check is invalid or a track names a lesson the pack doesn't have;
 * run the validator first for a readable list of problems.
 */
export function compilePack(spec: PackSpec, source: Pack['source'], customs: Customs = {}): Pack {
  const extra: Record<string, SkillSpec> = Object.fromEntries((spec.skills ?? []).map((s) => [s.id, s]));
  const packTags = spec.tags ?? [];
  const byLocal = new Map<string, Lesson>();
  const tracks: Track[] = spec.tracks.map((t) => ({ ...t, packId: spec.id, lessons: [], requires: t.requires ?? [], tags: [...new Set([...(t.tags ?? []), ...packTags])] }));
  for (const track of spec.tracks) {
    track.lessons.forEach((localId, i) => {
      const l = spec.lessons.find((x) => x.id === localId);
      if (!l) throw new Error(`Track "${track.id}" lists unknown lesson "${localId}"`);
      if (byLocal.has(localId)) throw new Error(`Lesson "${localId}" is in more than one track`);
      const { id: _id, tasks, challenge, tags, requires, ...rest } = l;
      void _id;
      const lesson: Lesson = {
        ...rest,
        id: qualify(spec.id, localId),
        localId,
        packId: spec.id,
        trackId: track.id,
        number: i + 1,
        tier: tierOf(l.teaches, extra),
        tasks: tasks.map((t, n) => named(`${localId} task ${n + 1}`, () => compileTask(t, customs))),
        ...(challenge ? { challenge: named(`${localId} challenge`, () => compileTask(challenge, customs)) } : {}),
        // The lesson's own tags first, so the most specific ones show on the map.
        tags: [...new Set([...(tags ?? []), ...(track.tags ?? []), ...packTags])],
        requires: requires ?? defaultRequires(l, extra),
      };
      byLocal.set(localId, lesson);
      tracks.find((x) => x.id === track.id)!.lessons.push(lesson);
    });
  }
  // A track with no stated requirements builds on what its first lesson needs, less anything this
  // pack teaches itself (a pack can't ask newcomers for a skill it is there to teach).
  const taughtHere = new Set(spec.lessons.flatMap((l) => l.teaches));
  for (const track of tracks) if (!track.requires.length && track.lessons[0]) track.requires = track.lessons[0].requires.filter((r) => !taughtHere.has(r));
  const lessons = tracks.flatMap((t) => t.lessons);
  for (const l of spec.lessons) if (!byLocal.has(l.id)) throw new Error(`Lesson "${l.id}" is not in any track`);
  return { ...spec, tracks, lessons, source };
}

export const corePack: Pack = compilePack(coreJson as unknown as PackSpec, 'builtin', CORE_CUSTOMS);

/** The page for a lesson: core lessons have their own prerendered pages; others go through ?id=. */
export function lessonHref(lesson: Pick<Lesson, 'id' | 'packId'>): string {
  return lesson.packId === CORE_PACK_ID ? `/learn/${lesson.id}` : `/learn/lesson/?id=${encodeURIComponent(lesson.id)}`;
}

// ---------- the registry ----------

let packs: Pack[] = [corePack];
let order: string[] = [];
const listeners = new Set<() => void>();

/** The order packs show in: core first, then the site's index order, then imported packs by title. */
function sorted(list: Pack[]): Pack[] {
  const rank = (p: Pack) => (p.id === CORE_PACK_ID ? -1 : order.indexOf(p.id) >= 0 ? order.indexOf(p.id) : order.length);
  return [...list].sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title));
}

export function allPacks(): Pack[] {
  return packs;
}

/** Sets the display order of the site's packs (ids, from public/packs/index.json). */
export function setPackOrder(ids: string[]) {
  order = ids;
  packs = sorted(packs);
  listeners.forEach((cb) => cb());
}
export function allLessons(): Lesson[] {
  return packs.flatMap((p) => p.lessons);
}
export function getLesson(id: string): Lesson | undefined {
  for (const p of packs) for (const l of p.lessons) if (l.id === id) return l;
  return undefined;
}
export function getPack(id: string): Pack | undefined {
  return packs.find((p) => p.id === id);
}
export function trackOf(lesson: Lesson): Track {
  return getPack(lesson.packId)!.tracks.find((t) => t.id === lesson.trackId)!;
}
/** Previous and next lesson in the same track. */
export function neighbours(lesson: Lesson): { prev?: Lesson; next?: Lesson } {
  const list = trackOf(lesson).lessons;
  const i = list.indexOf(lesson);
  return { prev: list[i - 1], next: list[i + 1] };
}
/** Adds or replaces a pack (the core pack can't be replaced). Returns false if refused. */
export function registerPack(pack: Pack): boolean {
  if (pack.id === CORE_PACK_ID) return false;
  packs = sorted([...packs.filter((p) => p.id !== pack.id), pack]);
  listeners.forEach((cb) => cb());
  return true;
}
export function unregisterPack(id: string) {
  if (id === CORE_PACK_ID) return;
  packs = packs.filter((p) => p.id !== id);
  listeners.forEach((cb) => cb());
}
/** Subscribe to packs being added or removed (for React: usePacks). */
export function onPacksChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// ---------- skills and the map ----------

/** Every skill the registered packs know: the catalogue plus pack-defined ones. */
export function allSkills(): Record<string, SkillSpec> {
  const out: Record<string, SkillSpec> = { ...SKILL_BY_ID };
  for (const p of packs) for (const s of p.skills ?? []) out[s.id] ??= s;
  return out;
}

/** Skills the learner knows: everything taught by a done lesson, and their prerequisites. */
export function knownSkills(progress: Progress): Set<string> {
  const taught = allLessons()
    .filter((l) => progress[l.id]?.status === 'done')
    .flatMap((l) => l.teaches);
  return closure(taught, allSkills());
}

export type LessonState = 'done' | 'started' | 'next' | 'open';

/**
 * How a lesson shows on the map. Nothing is locked (skip ahead whenever you like): 'next' marks
 * the first unfinished lesson of each track whose prerequisites are known.
 */
export function lessonState(lesson: Lesson, progress: Progress, known: Set<string>): LessonState {
  const p = progress[lesson.id];
  if (p?.status === 'done') return 'done';
  if (p?.status === 'started') return 'started';
  const track = trackOf(lesson);
  const firstOpen = track.lessons.find((l) => progress[l.id]?.status !== 'done');
  if (firstOpen === lesson && track.requires.every((r) => known.has(r))) return 'next';
  return 'open';
}

/** Skills a track needs that the learner doesn't have yet. */
export function missingSkills(track: Track, known: Set<string>): Skill[] {
  return track.requires.filter((r) => !known.has(r)).map((r) => SKILL_BY_ID[r] ?? { ...(allSkills()[r] ?? { id: r, name: r, definition: '' }), tier: 'intermediate' as const, requires: [] });
}

/**
 * Methods the GUI may offer in a lesson: what this lesson and every earlier lesson in its pack
 * introduce, plus what any lesson teaching one of its (required or taught) skills introduces.
 * Names like ".lpf" or "patterned .gain" map to the method "lpf" / "gain".
 */
export function allowedMethods(lesson: Lesson): Set<string> {
  const out = new Set<string>();
  const add = (names: string[]) => {
    for (const name of names) {
      const m = /\.([A-Za-z]+)/.exec(name) ?? /^([a-z][A-Za-z]*)$/.exec(name);
      if (m) out.add(m[1]);
    }
  };
  const pack = getPack(lesson.packId)!;
  for (const l of pack.lessons) {
    add(l.introduces);
    if (l === lesson) break;
  }
  const skills = closure([...lesson.requires, ...lesson.teaches], allSkills());
  for (const l of allLessons()) if (l.teaches.some((s) => skills.has(s))) add(l.introduces);
  return out;
}

/** Lessons matching a search: words in the title, goal, tags, introduces or skill names. */
export function searchLessons(query: string, tags: string[] = []): Lesson[] {
  const q = query.trim().toLowerCase();
  const words = q ? q.split(/\s+/) : [];
  const skills = allSkills();
  return allLessons().filter((l) => {
    if (tags.some((t) => !l.tags.includes(t))) return false;
    if (!words.length) return true;
    const hay = [l.title, l.goal, ...l.tags, ...l.introduces, ...(l.concepts ?? []), ...l.teaches.map((s) => skills[s]?.name ?? s)].join(' ').toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

/** Every tag in use, most common first. */
export function allTags(): string[] {
  const counts = new Map<string, number>();
  for (const l of allLessons()) for (const t of l.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
}
