// What the assistant sees (the <context> block sent with each message) and the two tools it can
// use to change the code. Pure functions over strings, so they are easy to test; the store
// applies the resulting changes to the editor.
import type Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { FriendlyError } from '@/lib/errors/friendly';
import type { EditorContext } from '@/lib/stores/editor';

export interface ContextInput {
  /** null when the page has no code editor. */
  editor: EditorContext | null;
  page: string;
  code: string;
  selection: { from: number; to: number } | null;
  error: FriendlyError | null;
  runtimeError: FriendlyError | null;
  /** The learner turned off sending the selection / the error. */
  useSelection: boolean;
}

export function numbered(code: string, firstLine = 1): string {
  const lines = code.split('\n');
  const width = String(firstLine + lines.length - 1).length;
  return lines.map((l, i) => `${String(firstLine + i).padStart(width)}| ${l}`).join('\n');
}

export function lineOf(code: string, pos: number): number {
  return code.slice(0, pos).split('\n').length;
}

function describeError(e: FriendlyError): string {
  const head = `${e.line ? `Line ${e.line}: ` : ''}${e.title}`;
  return e.detail && e.detail !== e.title ? `${head}\n${e.detail}` : head;
}

/** The <context> block that goes before each learner message. */
export function buildContext(input: ContextInput): string {
  const { editor } = input;
  if (!editor) return `<context>\nPage: ${input.page} (no code editor on this page; editing is not allowed)\n</context>`;
  const parts = [
    `Page: ${editor.label}`,
    editor.mode === 'edit' ? 'Editing: allowed (use edit_code / replace_code)' : 'Editing: not allowed (lesson: explain and hint only)',
  ];
  if (editor.about) parts.push(editor.about);
  parts.push(`Code:\n${input.code ? numbered(input.code) : '(empty)'}`);
  const sel = input.useSelection ? input.selection : null;
  if (sel) {
    const from = lineOf(input.code, sel.from);
    const to = lineOf(input.code, sel.to);
    parts.push(`Selected (line${from === to ? ` ${from}` : `s ${from}–${to}`}):\n${input.code.slice(sel.from, sel.to)}`);
  }
  if (input.error) parts.push(`Error when run:\n${describeError(input.error)}`);
  if (input.runtimeError) parts.push(`Problem while playing:\n${describeError(input.runtimeError)}`);
  return `<context>\n${parts.join('\n\n')}\n</context>`;
}

// ---------- tools ----------

export const editCodeInput = z.object({
  find: z.string().min(1),
  replace: z.string(),
  description: z.string(),
});

export const replaceCodeInput = z.object({
  code: z.string(),
  description: z.string(),
});

const description = {
  type: 'string',
  description: 'A few words saying what this change does, shown on the undo button (e.g. "add open hats").',
} as const;

export const EDIT_TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: 'edit_code',
    description:
      'Replace one exact piece of the code in the editor. `find` must match the current code exactly (including spaces and quotes, without line numbers) and appear exactly once; include enough surrounding text to make it unique. Use several calls for several separate changes.',
    input_schema: {
      type: 'object',
      properties: {
        find: { type: 'string', description: 'The exact text to replace.' },
        replace: { type: 'string', description: 'The new text.' },
        description,
      },
      required: ['find', 'replace', 'description'],
      additionalProperties: false,
    },
    strict: true,
    eager_input_streaming: true,
  },
  {
    name: 'replace_code',
    description: 'Replace the whole program in the editor. Only for big rewrites or a fresh start; prefer edit_code for changes.',
    input_schema: {
      type: 'object',
      properties: { code: { type: 'string', description: 'The complete new program.' }, description },
      required: ['code', 'description'],
      additionalProperties: false,
    },
    strict: true,
    eager_input_streaming: true,
  },
];

export type ToolPlan =
  | { ok: true; from: number; to: number; insert: string; summary: string }
  | { ok: false; message: string };

/** Works out what a tool call changes in `code`, or why it can't be applied. */
export function planToolCall(name: string, input: unknown, code: string): ToolPlan {
  if (name === 'edit_code') {
    const parsed = editCodeInput.safeParse(input);
    if (!parsed.success) return { ok: false, message: 'Invalid input: edit_code needs find, replace and description strings.' };
    const { find, replace, description } = parsed.data;
    const at = code.indexOf(find);
    if (at < 0) return { ok: false, message: `\`find\` was not found in the current code. The current code is:\n${code}` };
    if (code.indexOf(find, at + 1) >= 0) return { ok: false, message: '`find` appears more than once; include more surrounding text so it matches one place.' };
    return { ok: true, ...trimChange(code, at, at + find.length, replace), summary: description || 'edit' };
  }
  if (name === 'replace_code') {
    const parsed = replaceCodeInput.safeParse(input);
    if (!parsed.success) return { ok: false, message: 'Invalid input: replace_code needs code and description strings.' };
    return { ok: true, ...trimChange(code, 0, code.length, parsed.data.code), summary: parsed.data.description || 'rewrite' };
  }
  return { ok: false, message: `Unknown tool ${name}.` };
}

/** Shrinks a replacement to the part that actually differs, so only that flashes (and is tracked for undo). */
export function trimChange(code: string, from: number, to: number, insert: string) {
  const old = code.slice(from, to);
  let start = 0;
  while (start < old.length && start < insert.length && old[start] === insert[start]) start++;
  let end = 0;
  while (end < old.length - start && end < insert.length - start && old[old.length - 1 - end] === insert[insert.length - 1 - end]) end++;
  return { from: from + start, to: to - end, insert: insert.slice(start, insert.length - end) };
}
