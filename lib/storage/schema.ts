import { z } from 'zod';

export const BLOCK_KINDS = ['part', 'modifier', 'group', 'section', 'arrangement'] as const;
export const ROLES = ['kick', 'clap', 'snare', 'hats', 'perc', 'bass', 'chords', 'lead', 'acid', 'pad', 'fx', 'other'] as const;

const identifier = z.string().regex(/^[A-Za-z_$][\w$]*$/, 'must be a valid JavaScript name');
const isoDate = z.string().datetime();

export const libraryItemSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(BLOCK_KINDS),
  name: identifier,
  /** The full `const name = …` statement. */
  code: z.string(),
  role: z.enum(ROLES).optional(),
  tags: z.array(z.string()).default([]),
  /** Fallback key metadata for absolute-note parts. */
  key: z.string().optional(),
  bpmHint: z.number().positive().optional(),
  /** Names of parts/modifiers this block references. */
  requires: z.array(identifier).default([]),
  version: z.number().int().min(1),
  origin: z.object({ libraryId: z.string(), version: z.number().int() }).optional(),
  source: z.object({ lessonId: z.string() }).optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type LibraryItem = z.infer<typeof libraryItemSchema>;

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** The whole code buffer: the source of truth. */
  code: z.string(),
  /** Metadata keyed by const name, kept out of the code. */
  blockMeta: z
    .record(
      z.string(),
      z.object({
        libraryOrigin: z.object({ id: z.string(), version: z.number().int() }).optional(),
        tags: z.array(z.string()).optional(),
      }),
    )
    .default({}),
  createdAt: isoDate,
  updatedAt: isoDate,
});
export type Project = z.infer<typeof projectSchema>;

export const lessonProgressSchema = z.object({
  status: z.enum(['new', 'started', 'done']),
  tasksPassed: z.array(z.number().int()).default([]),
  challengePassed: z.boolean().default(false),
  /** Done because the learner said so, not because every check passed. */
  manual: z.boolean().default(false),
  lastCode: z.string().optional(),
  updatedAt: isoDate,
});
export type LessonProgress = z.infer<typeof lessonProgressSchema>;
export const progressSchema = z.record(z.string(), lessonProgressSchema);
export type Progress = z.infer<typeof progressSchema>;

export const settingsSchema = z.object({
  autoPlayGuiEdits: z.boolean().default(true),
  autocomplete: z.boolean().default(true),
  /** Controls beside the code (wide screens) or under it. */
  layout: z.enum(['side', 'stacked']).default('side'),
});
export type Settings = z.infer<typeof settingsSchema>;

export const EXPORT_FORMAT = 'strudel-workshop';

export const exportFileSchema = z.object({
  format: z.literal(EXPORT_FORMAT),
  version: z.literal(1),
  exportedAt: isoDate,
  items: z.array(libraryItemSchema).default([]),
  projects: z.array(projectSchema).default([]),
});
export type ExportFile = z.infer<typeof exportFileSchema>;
