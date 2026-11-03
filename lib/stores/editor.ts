import { create } from 'zustand';
import type { EditorView } from '@codemirror/view';
import { applyGuiEdits, type TextEdit } from '@/lib/editor/guiEdits';
import type { FriendlyError } from '@/lib/errors/friendly';

/** What the page around the editor is, so the assistant knows whether it may change the code. */
export interface EditorContext {
  /** 'edit': the assistant may change the code (sandbox). 'hints': it may only explain (lessons). */
  mode: 'edit' | 'hints';
  /** Where the learner is, e.g. "Sandbox: Acid jam" or "Lesson 4: Hi-hats". */
  label: string;
  /** Extra background for the assistant, e.g. the lesson's goal and current task. */
  about?: string;
}

// CodeMirror's document is the source of truth for the code. This store mirrors it so React
// components (GUI panels, lesson checks) can read it, and routes GUI edits back into the editor.
interface EditorStore {
  code: string;
  view: EditorView | null;
  setView(view: EditorView | null): void;
  setCode(code: string): void;
  /** The selected range, or null when the selection is empty. */
  selection: { from: number; to: number } | null;
  setSelection(selection: { from: number; to: number } | null): void;
  /** Summaries of the assistant's changes that can be undone, newest last. */
  agentUndo: string[];
  setAgentUndo(summaries: string[]): void;
  context: EditorContext | null;
  setContext(context: EditorContext | null): void;
  /** The last evaluation error and runtime problem the workbench shows. */
  problems: { error: FriendlyError | null; runtimeError: FriendlyError | null };
  setProblems(problems: EditorStore['problems']): void;
  /**
   * Applies GUI edits with the changed-span highlight. `basedOn` is the code the edits were
   * computed from; returns false (no change) if the editor no longer holds exactly that code.
   */
  applyEdits(edits: TextEdit[], basedOn: string): boolean;
  /** Replaces the whole document (loading a lesson, "use solution"). */
  replaceAll(code: string): void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  code: '',
  view: null,
  setView: (view) => set({ view }),
  setCode: (code) => set({ code }),
  selection: null,
  setSelection: (selection) => {
    const old = get().selection;
    if (old?.from !== selection?.from || old?.to !== selection?.to) set({ selection });
  },
  agentUndo: [],
  setAgentUndo: (agentUndo) => set({ agentUndo }),
  context: null,
  setContext: (context) => set({ context }),
  problems: { error: null, runtimeError: null },
  setProblems: (problems) => set({ problems }),
  applyEdits(edits, basedOn) {
    const { view } = get();
    if (!view || edits.length === 0) return false;
    return applyGuiEdits(view, edits, basedOn);
  },
  replaceAll(code) {
    const { view } = get();
    if (!view) return set({ code });
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: code } });
  },
}));

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  Object.assign(window, { __editor: useEditorStore });
}
