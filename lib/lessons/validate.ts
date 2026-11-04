// The lesson-pack validator: the one judge of whether a pack is sound, run by the test suite on
// the built-in packs, by `npm run lessons:validate` for authors, and in the browser when a pack is
// imported or written in the author page. It walks every lesson the way a learner would (see
// docs/design.md §1.1, the isolation rule) and reports findings rather than throwing.
import { z } from 'zod';
import { SKILL_BY_ID, SUGGESTED_TAGS } from '@/content/skills';
import { REFERENCE } from '@/lib/reference/entries';
import { DRUM_NAMES, SYNTHS, findMachine } from '@/lib/sounds/catalog';
import { parseProject } from '@/lib/sync/parseProject';
import { buildContext } from './checks';
import { checkSchema, customsUsed, type Customs } from './dsl';
import { compilePack } from './packs';
import type { CheckContext, Lesson, Pack, PackSpec, Task } from './types';

export interface Finding {
  level: 'error' | 'warning';
  /** Local lesson id, when the finding is about one lesson. */
  lesson?: string;
  /** "task 2", "challenge", "starter", "after task 1"… */
  where?: string;
  message: string;
}

export interface ValidateOptions {
  /** Named checks the pack may use (built-in packs only). */
  customs?: Customs;
  /** Treat as a built-in pack: `custom` checks allowed, the id "core" allowed. */
  builtin?: boolean;
  /** Stop after the schema and structure checks (no evaluation). */
  quick?: boolean;
}

export interface ValidateResult {
  findings: Finding[];
  errors: number;
  warnings: number;
  /** The compiled pack, when it compiled (there may still be errors from the walk). */
  pack?: Pack;
}

// ---------- schema ----------

const slug = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'lower-case letters, digits and dashes');
const taskSchema = z
  .object({ text: z.string().min(1), hint: z.string().min(1), check: z.unknown(), replacedLater: z.boolean().optional() })
  .strict();
const lessonSchema = z
  .object({
    id: slug,
    title: z.string().min(1),
    goal: z.string().min(1),
    concept: z.string(),
    shape: z.enum(['concept', 'drill', 'fix', 'remix', 'kata', 'project']).optional(),
    starter: z.string(),
    tasks: z.array(taskSchema).min(1),
    challenge: taskSchema.optional(),
    steps: z.array(z.string()),
    solution: z.string().min(1),
    challengeSolution: z.string().optional(),
    summary: z.array(z.string()),
    introduces: z.array(z.string()),
    concepts: z.array(z.string()).optional(),
    teaches: z.array(z.string()),
    requires: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    composition: z.boolean().optional(),
    library: z.boolean().optional(),
    preload: z.array(z.object({ s: z.string(), bank: z.string().optional() }).strict()).optional(),
    reference: z.string().optional(),
  })
  .strict();
const trackSchema = z
  .object({
    id: slug,
    title: z.string().min(1),
    blurb: z.string(),
    kind: z.enum(['skills', 'line']),
    requires: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    lessons: z.array(z.string()).min(1),
  })
  .strict();
export const packSchema = z
  .object({
    format: z.literal('strudel-workshop-pack'),
    version: z.literal(1),
    id: slug,
    title: z.string().min(1),
    description: z.string(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    skills: z.array(z.object({ id: z.string().min(1), name: z.string().min(1), definition: z.string(), requires: z.array(z.string()).optional() }).strict()).optional(),
    samples: z.array(z.object({ url: z.string().url(), base: z.string().optional() }).strict()).optional(),
    tracks: z.array(trackSchema).min(1),
    lessons: z.array(lessonSchema).min(1),
  })
  .strict();

// ---------- the walk ----------

const passes = (t: Task, ctx: CheckContext) => {
  try {
    return t.check(ctx);
  } catch {
    return false;
  }
};

/** Roughly how many lines changed between two versions of the code. */
function linesChanged(a: string, b: string): number {
  const count = (xs: string[]) => xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>());
  const ca = count(a.split('\n').map((l) => l.trim()).filter(Boolean));
  const cb = count(b.split('\n').map((l) => l.trim()).filter(Boolean));
  let n = 0;
  for (const [l, k] of ca) n += Math.max(0, k - (cb.get(l) ?? 0));
  for (const [l, k] of cb) n += Math.max(0, k - (ca.get(l) ?? 0));
  return n;
}

const referenceNames = new Set(REFERENCE.flatMap((e) => [e.name, e.display, ...(e.aliases ? e.aliases.split(/,\s*/) : [])]));
const soundNames = new Set([...Object.keys(DRUM_NAMES), ...SYNTHS.map((s) => s.sound)]);

/** Validates a pack's JSON (already parsed). Never throws. */
export async function validatePack(json: unknown, opts: ValidateOptions = {}): Promise<ValidateResult> {
  const findings: Finding[] = [];
  const err = (message: string, lesson?: string, where?: string) => findings.push({ level: 'error', message, lesson, where });
  const warn = (message: string, lesson?: string, where?: string) => findings.push({ level: 'warning', message, lesson, where });
  const done = (pack?: Pack): ValidateResult => ({
    findings,
    errors: findings.filter((f) => f.level === 'error').length,
    warnings: findings.filter((f) => f.level === 'warning').length,
    pack,
  });

  const parsed = packSchema.safeParse(json);
  if (!parsed.success) {
    for (const i of parsed.error.issues.slice(0, 20)) err(`${i.message} at ${i.path.join('.') || 'root'}`);
    return done();
  }
  const spec = parsed.data as PackSpec;
  if (spec.id === 'core' && !opts.builtin) err('The id "core" is the built-in pack; pick another.');

  // Structure: ids, tracks, skills, tags, sounds.
  const ids = new Set<string>();
  for (const l of spec.lessons) {
    if (ids.has(l.id)) err(`Duplicate lesson id "${l.id}"`);
    ids.add(l.id);
  }
  const inTrack = new Set<string>();
  for (const t of spec.tracks) {
    for (const id of t.lessons) {
      if (!ids.has(id)) err(`Track "${t.id}" lists a lesson that isn't in the pack: "${id}"`);
      if (inTrack.has(id)) err(`Lesson "${id}" is in more than one track`);
      inTrack.add(id);
    }
  }
  for (const l of spec.lessons) if (!inTrack.has(l.id)) err('Not in any track', l.id);
  const skills = new Set([...Object.keys(SKILL_BY_ID), ...(spec.skills ?? []).map((s) => s.id)]);
  for (const s of spec.skills ?? []) for (const r of s.requires ?? []) if (!skills.has(r)) err(`Skill "${s.id}" requires unknown skill "${r}"`);
  const tagsSeen = new Set<string>();
  for (const l of spec.lessons) {
    for (const s of l.teaches) if (!skills.has(s)) err(`Unknown skill "${s}" in teaches`, l.id);
    for (const s of l.requires ?? []) if (!skills.has(s)) err(`Unknown skill "${s}" in requires`, l.id);
    if (!l.teaches.length) warn('Teaches no skill, so it never shows as known on the map', l.id);
    for (const i of l.introduces) if (!referenceNames.has(i) && !referenceNames.has(i.replace(/^\./, '')) && !/^patterned /.test(i)) warn(`"${i}" is not in the reference; if it is an idea rather than a function, put it under concepts`, l.id);
    for (const p of l.preload ?? []) {
      if (!soundNames.has(p.s)) warn(`Preload sound "${p.s}" is not a known sound name`, l.id);
      if (p.bank && !findMachine(p.bank)) warn(`Preload bank "${p.bank}" is not a known drum machine`, l.id);
    }
    for (const t of l.tags ?? []) tagsSeen.add(t);
    if (l.steps.length !== l.tasks.length - 1) err(`Needs ${l.tasks.length - 1} step(s) (one per task but the last), has ${l.steps.length}`, l.id);
    if (l.challenge && !l.challengeSolution) err('Has a challenge but no challengeSolution', l.id);
    if (l.challengeSolution && !l.challenge) warn('Has a challengeSolution but no challenge', l.id);
    for (const [where, t] of [...l.tasks.map((t, i) => [`task ${i + 1}`, t] as const), ...(l.challenge ? [['challenge', l.challenge] as const] : [])]) {
      const c = checkSchema.safeParse(t.check);
      if (!c.success) err(`Check is not valid: ${JSON.stringify(t.check).slice(0, 120)}`, l.id, where);
      const customs = customsUsed(t.check);
      if (customs.length && !opts.builtin) err(`Uses a custom check (${customs.join(', ')}); community packs must use the check language`, l.id, where);
      for (const name of customs) if (opts.builtin && !opts.customs?.[name]) err(`Unknown custom check "${name}"`, l.id, where);
    }
  }
  for (const t of spec.tags ?? []) tagsSeen.add(t);
  for (const t of tagsSeen) if (!SUGGESTED_TAGS.includes(t)) warn(`Tag "${t}" is new; see content/skills.ts for the tags others use`);
  if (findings.some((f) => f.level === 'error')) return done();

  let pack: Pack;
  try {
    pack = compilePack(spec, opts.builtin ? 'builtin' : 'imported', opts.customs);
  } catch (e) {
    err(`Does not compile: ${(e as Error).message}`);
    return done();
  }
  if (opts.quick) return done(pack);

  // Each lesson, the way a learner would do it.
  const silence = await buildContext('silence');
  for (const lesson of pack.lessons) {
    await walkLesson(lesson, { err, warn }, 'error' in silence ? null : silence.ctx);
  }
  // Track lines: each lesson starts where the last one ended, and never breaks what came before.
  for (const track of pack.tracks) {
    if (track.kind !== 'line') continue;
    for (let i = 1; i < track.lessons.length; i++) {
      const prev = track.lessons[i - 1];
      const cur = track.lessons[i];
      if (cur.starter.trim() !== prev.solution.trim() && cur.starter.trim() !== (prev.challengeSolution ?? '').trim()) {
        err(`In line "${track.id}" the starter must be the previous lesson's solution (${prev.localId})`, cur.localId, 'starter');
      }
      for (const [where, code] of [['solution', cur.solution] as const, ['challengeSolution', cur.challengeSolution] as const]) {
        if (!code) continue;
        const r = await buildContext(code);
        if ('error' in r) continue;
        // Once the track is arranged, bar 1 is the intro, so earlier bar-1 checks no longer apply.
        if (r.ctx.model.final?.kind === 'arrange') continue;
        for (const earlier of track.lessons.slice(0, i)) {
          earlier.tasks.forEach((t, n) => {
            if (!t.replacedLater && !passes(t, r.ctx)) err(`Undoes ${earlier.localId} task ${n + 1} ("${t.text}")`, cur.localId, where);
          });
        }
      }
    }
  }
  return done(pack);
}

type Report = { err: (m: string, l?: string, w?: string) => void; warn: (m: string, l?: string, w?: string) => void };

async function walkLesson(lesson: Lesson, { err, warn }: Report, silence: CheckContext | null) {
  const id = lesson.localId;
  const all = [...lesson.tasks.map((t, i) => [`task ${i + 1}`, t] as const), ...(lesson.challenge ? [['challenge', lesson.challenge] as const] : [])];
  if (silence) for (const [where, t] of all) if (passes(t, silence)) err('Passes with no music at all (the check is too loose)', id, where);
  if (parseProject(lesson.starter).syntaxError && lesson.starter.trim()) err('Starter does not parse', id, 'starter');
  if (lesson.reference) {
    const r = await buildContext(lesson.reference);
    if ('error' in r) err(`Reference does not run: ${r.error}`, id, 'reference');
    else lesson.tasks.forEach((t, i) => passes(t, r.ctx) || err(`Task ${i + 1} should pass on the reference`, id, 'reference'));
  }

  const stages = [
    { label: 'starter', code: lesson.starter, done: 0 },
    ...lesson.steps.map((code, i) => ({ label: `after task ${i + 1}`, code, done: i + 1 })),
    { label: 'solution', code: lesson.solution, done: lesson.tasks.length },
  ];
  let prevCode = '';
  for (const { label, code, done } of stages) {
    if (prevCode && linesChanged(prevCode, code) > 8) warn('Changes many lines at once; a step should do just what its hint says', id, label);
    prevCode = code;
    const r = await buildContext(code);
    if ('error' in r) {
      if (done === 0) continue; // an empty starter can't evaluate; anything later must
      err(`Does not run: ${r.error}`, id, label);
      continue;
    }
    lesson.tasks.forEach((t, i) => {
      const n = i + 1;
      const ok = passes(t, r.ctx);
      if (n > done && ok) err(`Task ${n} passes too early ("${t.text}")`, id, label);
      else if (n <= done && (n === done || !t.replacedLater) && !ok) err(`Task ${n} should pass by now ("${t.text}")`, id, label);
    });
    if (lesson.challenge && passes(lesson.challenge, r.ctx)) err('The challenge passes too early', id, label);
    if (label === 'solution' && r.ctx.model.final?.kind === 'custom') warn('The final line is not a stack, arrange or part, so the panels cannot follow it', id, label);
  }
  if (lesson.challenge && lesson.challengeSolution) {
    const r = await buildContext(lesson.challengeSolution);
    if ('error' in r) err(`Does not run: ${r.error}`, id, 'challengeSolution');
    else {
      lesson.tasks.forEach((t, i) => {
        if (!t.replacedLater && !passes(t, r.ctx)) err(`Task ${i + 1} should still pass ("${t.text}")`, id, 'challengeSolution');
      });
      if (!passes(lesson.challenge, r.ctx)) err('The challenge should pass', id, 'challengeSolution');
    }
  }
}

/** One line per finding, for the CLI and the author page. */
export function formatFinding(f: Finding): string {
  const where = [f.lesson, f.where].filter(Boolean).join(' · ');
  return `${f.level === 'error' ? '✗' : '!'} ${where ? `${where}: ` : ''}${f.message}`;
}
