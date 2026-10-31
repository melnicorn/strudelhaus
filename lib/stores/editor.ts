import { create } from 'zustand';
import type { EditorView } from '@codemirror/view';
import { applyGuiEdits, type TextEdit } from '@/lib/editor/guiEdits';

// CodeMirror's document is the source of truth for the code. This store mirrors it so React
// components (GUI panels, lesson checks) can read it, and routes GUI edits back into the editor.
interface EditorStore {
  code: string;
  view: EditorView | null;
  setView(view: EditorView | null): void;
  setCode(code: string): void;
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
