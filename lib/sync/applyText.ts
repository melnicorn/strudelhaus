import type { TextEdit } from '@/lib/editor/guiEdits';

/**
 * Applies edits to a string the same way the editor does (all positions refer to the original
 * text). Throws if `basedOn` (the code the edits were computed from) differs from `code`, if an
 * edit's expected text doesn't match, or if edits overlap.
 */
export function applyTextEdits(code: string, edits: TextEdit[], basedOn?: string): string {
  if (basedOn !== undefined && basedOn !== code) throw new Error('the code changed since these edits were made');
  const sorted = [...edits].sort((a, b) => a.from - b.from || a.to - b.to);
  let out = '';
  let pos = 0;
  for (const e of sorted) {
    if (e.from < pos) throw new Error('overlapping edits');
    if (code.slice(e.from, e.to) !== e.expected) {
      throw new Error(`expected ${JSON.stringify(e.expected)} at ${e.from}, found ${JSON.stringify(code.slice(e.from, e.to))}`);
    }
    out += code.slice(pos, e.from) + e.insert;
    pos = e.to;
  }
  return out + code.slice(pos);
}
