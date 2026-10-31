// Marks words in the code that the dictionary or reference can explain (function names and
// sound names inside strings). The marks are invisible until ⌘/Ctrl is held; see TermHover.
import { RangeSetBuilder } from '@codemirror/state';
import { Decoration, ViewPlugin, type DecorationSet, type EditorView, type ViewUpdate } from '@codemirror/view';
import { TERMS_BY_CODE } from '@/lib/dictionary/terms';
import { METHODS } from '@/lib/sync/allowlist';

const FUNCTIONS = new Set(['s', 'sound', 'note', 'n', 'chord', 'stack', 'arrange', 'setcpm', 'setcps', ...Object.keys(METHODS)]);
const marks = new Map<string, Decoration>();
const mark = (word: string) => {
  let d = marks.get(word);
  if (!d) marks.set(word, (d = Decoration.mark({ attributes: { 'data-code': word } })));
  return d;
};

const CALL = /\b([A-Za-z_$][\w$]*)\s*\(/g;
const STRING = /"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`/g;
const WORD = /[A-Za-z][A-Za-z0-9]*/g;

export function findCodeTerms(text: string, offset = 0): { from: number; to: number; word: string }[] {
  const out: { from: number; to: number; word: string }[] = [];
  const strings: [number, number][] = [];
  for (const m of text.matchAll(STRING)) {
    const start = m.index! + 1;
    const body = m[1] ?? m[2] ?? m[3] ?? '';
    strings.push([m.index!, m.index! + m[0].length]);
    for (const w of body.matchAll(WORD)) {
      if (TERMS_BY_CODE.has(w[0].toLowerCase())) out.push({ from: offset + start + w.index!, to: offset + start + w.index! + w[0].length, word: w[0] });
    }
  }
  for (const m of text.matchAll(CALL)) {
    const at = m.index!;
    if (strings.some(([a, b]) => at >= a && at < b)) continue;
    if (FUNCTIONS.has(m[1]) || TERMS_BY_CODE.has(m[1].toLowerCase())) out.push({ from: offset + at, to: offset + at + m[1].length, word: m[1] });
  }
  return out.sort((a, b) => a.from - b.from);
}

function build(view: EditorView): DecorationSet {
  const b = new RangeSetBuilder<Decoration>();
  for (const { from, to } of view.visibleRanges) {
    for (const t of findCodeTerms(view.state.doc.sliceString(from, to), from)) b.add(t.from, t.to, mark(t.word));
  }
  return b.finish();
}

export const codeTerms = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = build(view);
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged) this.decorations = build(u.view);
    }
  },
  { decorations: (v) => v.decorations },
);
