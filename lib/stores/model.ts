// The parsed view of the editor's code, for GUI panels. Rendering uses a lightly debounced
// parse; GUI actions always re-parse the exact current code before computing edits.
import { create } from 'zustand';
import type { TextEdit } from '@/lib/editor/guiEdits';
import type { ProjectModel } from '@/lib/sync/model';
import { parseProject } from '@/lib/sync/parseProject';
import { useEditorStore } from './editor';

interface ModelStore {
  /** The latest model that parsed without a syntax error (panels keep showing it). */
  model: ProjectModel;
  /** Set while the code has a syntax error: controls are paused. */
  syntaxError: ProjectModel['syntaxError'] | null;
}

const empty = parseProject('');

export const useModelStore = create<ModelStore>(() => ({ model: empty, syntaxError: null }));

function reparse(code: string) {
  const model = parseProject(code);
  if (model.syntaxError) useModelStore.setState({ syntaxError: model.syntaxError });
  else useModelStore.setState({ model, syntaxError: null });
}

let timer: ReturnType<typeof setTimeout> | undefined;
let lastCode = '';
useEditorStore.subscribe((state) => {
  if (state.code === lastCode) return;
  const first = lastCode === '';
  lastCode = state.code;
  clearTimeout(timer);
  if (first) reparse(state.code);
  else timer = setTimeout(() => reparse(state.code), 120);
});

type AfterEdit = () => void;
let afterEdit: AfterEdit | null = null;

/** The workbench registers what to do after a GUI edit (re-run the code while playing). */
export function setAfterGuiEdit(fn: AfterEdit | null) {
  afterEdit = fn;
}

/**
 * Runs a GUI action: parses the current code, asks `make` for edits, and applies them only if
 * the editor still holds exactly that code. Returns false if nothing changed.
 */
export function runGuiEdit(make: (model: ProjectModel) => TextEdit[]): boolean {
  const { code, applyEdits } = useEditorStore.getState();
  const model = parseProject(code);
  if (model.syntaxError) return false;
  const edits = make(model);
  if (!edits.length) return false;
  const ok = applyEdits(edits, code);
  if (ok) {
    clearTimeout(timer);
    reparse(useEditorStore.getState().code);
    afterEdit?.();
  }
  return ok;
}
