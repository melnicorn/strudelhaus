import { StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, type DecorationSet } from '@codemirror/view';

/** Line number (1-based) of the last evaluation error, or null to clear. */
export const setErrorLine = StateEffect.define<number | null>();

const errorLineDeco = Decoration.line({ class: 'cm-error-line' });

const errorLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (!e.is(setErrorLine)) continue;
      const line = e.value;
      deco =
        line && line >= 1 && line <= tr.state.doc.lines
          ? Decoration.set([errorLineDeco.range(tr.state.doc.line(line).from)])
          : Decoration.none;
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

export const errorLine = [errorLineField];
