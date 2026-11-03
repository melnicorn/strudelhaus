// GUI controls change the code through here, never by replacing the whole document.
// Each edit says what text it expects to replace; if the code has changed since the GUI
// read it, the edit is refused instead of overwriting the learner's typing.
import { Annotation, StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, type DecorationSet } from '@codemirror/view';

export interface TextEdit {
  from: number;
  to: number;
  /** The exact text currently at [from, to). */
  expected: string;
  insert: string;
}

export const guiEdit = Annotation.define<boolean>();
const clearChanged = StateEffect.define<null>();

const FLASH_MS = 1600;
const changedMark = Decoration.mark({ class: 'cm-gui-changed' });

/** Briefly marks the text a GUI edit inserted, so the learner sees which code a control writes. */
const changedField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(marks, tr) {
    marks = marks.map(tr.changes);
    if (tr.annotation(guiEdit)) {
      const ranges: ReturnType<typeof changedMark.range>[] = [];
      tr.changes.iterChangedRanges((_fromA, _toA, fromB, toB) => {
        if (toB > fromB) ranges.push(changedMark.range(fromB, toB));
      });
      marks = Decoration.set(ranges, true);
    }
    for (const e of tr.effects) if (e.is(clearChanged)) marks = Decoration.none;
    return marks;
  },
  provide: (f) => EditorView.decorations.from(f),
});

let clearTimer: ReturnType<typeof setTimeout> | undefined;

export const guiEditHighlight = [changedField];

/**
 * Applies GUI edits as one transaction. Returns false (and changes nothing) if the document
 * isn't exactly `basedOn` (the code the GUI parsed to compute the edits), or if any edit's
 * expected text no longer matches.
 */
export function applyGuiEdits(view: EditorView, edits: TextEdit[], basedOn: string): boolean {
  const doc = view.state.doc;
  if (doc.toString() !== basedOn) return false;
  for (const e of edits) {
    if (e.from < 0 || e.to > doc.length || doc.sliceString(e.from, e.to) !== e.expected) return false;
  }
  view.dispatch({
    changes: edits.map(({ from, to, insert }) => ({ from, to, insert })),
    annotations: guiEdit.of(true),
    userEvent: 'input.gui',
  });
  flashChanged(view);
  return true;
}

/** Clears the changed-span highlight after a moment (call after a `guiEdit` transaction). */
export function flashChanged(view: EditorView) {
  clearTimeout(clearTimer);
  clearTimer = setTimeout(() => view.dispatch({ effects: clearChanged.of(null) }), FLASH_MS);
}
