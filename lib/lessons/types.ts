import type { StrudelHap, StrudelPattern } from '@/lib/audio/engine';
import type { ProjectModel } from '@/lib/sync/model';
import type { CheckExpr } from './dsl';

export type Tier = 'beginner' | 'intermediate' | 'expert';

/** What a check gets: the learner's evaluated code, queried without audio. */
export interface CheckContext {
  code: string;
  pattern: StrudelPattern;
  model: ProjectModel;
  /** Tempo set by setcpm, in BPM (setcpm(x) = x*4 BPM in our 4-beats-per-bar convention). */
  bpm?: number;
  /** Events that start within [0, cycles). */
  events(cycles?: number): StrudelHap[];
}

// ---------- the written form: what a lesson pack's JSON holds ----------

export type LessonShape = 'concept' | 'drill' | 'fix' | 'remix' | 'kata' | 'project';

export interface TaskSpec {
  text: string;
  hint: string;
  /** A check expression (lib/lessons/dsl.ts): data, so packs stay plain JSON. */
  check: CheckExpr;
  /** A later task changes this result (e.g. bd → sd), so the final solution needn't pass it. */
  replacedLater?: boolean;
}

export interface LessonSpec {
  /** Unique within the pack; the runtime id is "<pack>/<id>" (the core pack keeps bare ids). */
  id: string;
  title: string;
  goal: string;
  /** Plain-language explanation. Paragraphs separated by blank lines; `code` and **bold** allowed. */
  concept: string;
  shape?: LessonShape;
  starter: string;
  tasks: TaskSpec[];
  challenge?: TaskSpec;
  /**
   * The code after each task but the last, doing just what that task's hint says.
   * steps[i] passes tasks 0..i and nothing later (see the validator's isolation walk).
   */
  steps: string[];
  /** The code after the last task: passes every task (except those replaced later) and not the challenge. */
  solution: string;
  /** `solution` plus the challenge. Required when there is a challenge. */
  challengeSolution?: string;
  /** "You now know" bullets. */
  summary: string[];
  /** Strudel functions and notation introduced here (shown as chips, linked to the reference). */
  introduces: string[];
  /** Ideas introduced that aren't functions ("offbeats", "the library"). */
  concepts?: string[];
  /** Skill ids (content/skills.ts) this lesson teaches. */
  teaches: string[];
  /** Skill ids the learner should have first; defaults to the prerequisites of `teaches`. */
  requires?: string[];
  /** Free-text tags for search ("jungle", "808"); the pack's tags are added. */
  tags?: string[];
  /** Show group/modifier/arrangement panels. */
  composition?: boolean;
  /** Offer "Save parts to library" (off for the first lessons, before the library is introduced). */
  library?: boolean;
  /** Sounds to load before Play so the first hits aren't dropped. */
  preload?: { s: string; bank?: string }[];
}

export interface TrackSpec {
  id: string;
  title: string;
  blurb: string;
  /**
   * 'skills': each lesson stands alone. 'line': each lesson starts from the code the learner finished
   * in the one before, and the last lesson is a whole track.
   */
  kind: 'skills' | 'line';
  /** Skill ids needed before the track opens on the map (defaults to the first lesson's requires). */
  requires?: string[];
  tags?: string[];
  /** Lesson ids (local to the pack), in order. */
  lessons: string[];
}

export interface SkillSpec {
  id: string;
  name: string;
  definition: string;
  requires?: string[];
}

export interface PackSpec {
  format: 'strudel-workshop-pack';
  version: 1;
  id: string;
  title: string;
  description: string;
  author?: string;
  tags?: string[];
  /** Extra skills this pack defines (beyond content/skills.ts). */
  skills?: SkillSpec[];
  /** Strudel sample maps to load before playing (a strudel.json URL, with an optional base URL). */
  samples?: { url: string; base?: string }[];
  tracks: TrackSpec[];
  lessons: LessonSpec[];
}

// ---------- the runtime form: specs with compiled checks and resolved ids ----------

export interface Task {
  text: string;
  hint: string;
  check(ctx: CheckContext): boolean;
  replacedLater?: boolean;
}

export interface Lesson extends Omit<LessonSpec, 'id' | 'tasks' | 'challenge' | 'tags' | 'requires'> {
  /** The runtime id: bare for the core pack, "<pack>/<local id>" otherwise. */
  id: string;
  localId: string;
  packId: string;
  trackId: string;
  /** Position in its track, from 1 (what the map and the lesson page show). */
  number: number;
  tier: Tier;
  tasks: Task[];
  challenge?: Task;
  tags: string[];
  requires: string[];
}

export interface Track extends Omit<TrackSpec, 'lessons' | 'requires' | 'tags'> {
  packId: string;
  lessons: Lesson[];
  requires: string[];
  tags: string[];
}

export interface Pack extends Omit<PackSpec, 'tracks' | 'lessons'> {
  tracks: Track[];
  lessons: Lesson[];
  /** 'builtin' ships with the site; 'imported' came from a file or URL in this browser. */
  source: 'builtin' | 'imported';
}
