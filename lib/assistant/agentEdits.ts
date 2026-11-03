// Changes the assistant makes to the code, and undoing them. Each change is one transaction
// (so ⌘Z undoes it too) that flashes like a GUI edit, and is pushed on a small undo stack.
// Undo restores the code exactly when nothing has changed since; otherwise it reverts just the
// assistant's change, as long as the learner hasn't edited the text it wrote.
import { Annotation, ChangeSet, EditorState, StateField, Text, Transaction, type ChangeSpec, type TransactionSpec } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { flashChanged, guiEdit } from '@/lib/editor/guiEdits';

export interface AgentChange {
  id: number;
  /** One line for the undo button, e.g. "edit to hats". */
  summary: string;
  /** The code right after the change, and the exact inverse for that code. */
  after: string;
  inverse: ChangeSet;
  /** The inverse mapped through everything since, and the text the change wrote (mapped too). */
  mapped: ChangeSet;
  ranges: { from: number; to: number }[];
  /** The learner (or a later change) edited the text this change wrote. */
  touched: boolean;
}

const MAX_UNDO = 30;

const pushChange = Annotation.define<{ id: number; summary: string }>();
const popChange = Annotation.define<number>();

let nextId = 1;

export const agentChanges = StateField.define<AgentChange[]>({
  create: () => [],
  update(stack, tr) {
    const popped = tr.annotation(popChange);
    if (popped !== undefined) stack = stack.filter((c) => c.id !== popped);
    if (tr.docChanged) {
      stack = stack.map((c) => ({
        ...c,
        mapped: c.mapped.map(tr.changes),
        ranges: c.ranges.map((r) => ({ from: tr.changes.mapPos(r.from, -1), to: tr.changes.mapPos(r.to, 1) })),
        touched: c.touched || c.ranges.some((r) => tr.changes.touchesRange(r.from, r.to)),
      }));
    }
    const pushed = tr.annotation(pushChange);
    if (pushed) {
      const inverse = tr.changes.invert(tr.startState.doc);
      const ranges: AgentChange['ranges'] = [];
      tr.changes.iterChangedRanges((_fa, _ta, from, to) => ranges.push({ from, to }));
      const change = { ...pushed, after: tr.newDoc.toString(), inverse, mapped: inverse, ranges, touched: false };
      stack = [...stack, change].slice(-MAX_UNDO);
    }
    return stack;
  },
});

/** The transaction for one assistant change (one undoable, highlighted step). */
export function agentChangeSpec(changes: ChangeSpec, summary: string): TransactionSpec {
  return { changes, annotations: [guiEdit.of(true), pushChange.of({ id: nextId++, summary }), Transaction.userEvent.of('input.assistant')] };
}

/** Applies the assistant's changes as one undoable, highlighted step. */
export function applyAgentChange(view: EditorView, changes: ChangeSpec, summary: string) {
  view.dispatch(agentChangeSpec(changes, summary));
  flashChanged(view);
}

export type UndoResult = 'undone' | 'already' | 'conflict' | 'empty';

/**
 * Works out how to undo the assistant's latest change. 'already': the code is back to how it
 * was (e.g. after ⌘Z); 'conflict': the learner has edited what it wrote, so it is only dropped
 * from the stack. Either way the spec pops the change.
 */
export function undoSpec(state: EditorState): { result: UndoResult; spec?: TransactionSpec } {
  const top = agentStack(state).at(-1);
  if (!top) return { result: 'empty' };
  const pop = popChange.of(top.id);
  const undo = (changes: ChangeSet) => ({ changes, annotations: [guiEdit.of(true), pop, Transaction.userEvent.of('undo.assistant')] });
  const doc = state.doc;
  if (doc.toString() === top.after) return { result: 'undone', spec: undo(top.inverse) };
  if (doc.eq(top.inverse.apply(Text.of(top.after.split('\n'))))) return { result: 'already', spec: { annotations: pop } };
  if (top.touched) return { result: 'conflict', spec: { annotations: pop } };
  return { result: 'undone', spec: undo(top.mapped) };
}

/** Undoes the assistant's latest change in the editor (see undoSpec). */
export function undoAgentChange(view: EditorView): UndoResult {
  const { result, spec } = undoSpec(view.state);
  if (spec) view.dispatch(spec);
  if (result === 'undone') flashChanged(view);
  return result;
}

/** The undo stack of a state, newest last (empty if the editor doesn't track it). */
export function agentStack(state: EditorState): readonly AgentChange[] {
  return state.field(agentChanges, false) ?? [];
}
