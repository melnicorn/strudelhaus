import type { StrudelHap, StrudelPattern } from '@/lib/audio/engine';
import type { ProjectModel } from '@/lib/sync/model';

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

export interface Task {
  text: string;
  hint: string;
  check(ctx: CheckContext): boolean;
  /** A later task changes this result (e.g. bd → sd), so the final solution needn't pass it. */
  replacedLater?: boolean;
}

export interface Lesson {
  id: string;
  number: number;
  tier: Tier;
  title: string;
  goal: string;
  /** Plain-language explanation. Paragraphs separated by blank lines; `code` and **bold** allowed. */
  concept: string;
  starter: string;
  tasks: Task[];
  challenge?: Task;
  /** Passes every task (except those replaced later). */
  solution: string;
  /** Passes the challenge, if `solution` doesn't. */
  challengeSolution?: string;
  /** "You now know" bullets. */
  summary: string[];
  /** Strudel functions and notation introduced here (shown as chips, linked to the reference). */
  introduces: string[];
  /** Skill ids from docs/research.md. */
  skills: string[];
  /** Show group/modifier/arrangement panels. */
  composition?: boolean;
  /** Sounds to load before Play so the first hits aren't dropped. */
  preload?: { s: string; bank?: string }[];
}
