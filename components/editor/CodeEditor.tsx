'use client';

import { useEffect, useRef } from 'react';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { bracketMatching, indentOnInput } from '@codemirror/language';
import { EditorState, Prec } from '@codemirror/state';
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { errorLine } from '@/lib/editor/errorLine';
import { guiEditHighlight } from '@/lib/editor/guiEdits';
import { playingHighlight } from '@/lib/editor/playingHighlight';
import { codeTerms } from '@/lib/editor/terms';
import { strudelTheme } from '@/lib/editor/theme';
import { useEditorStore } from '@/lib/stores/editor';

interface Props {
  initialCode: string;
  /** Ctrl/Cmd+Enter or Alt+Enter. */
  onEvaluate(): void;
  /** Ctrl/Cmd+. */
  onStop(): void;
  ariaLabel?: string;
}

/** The Strudel code editor. Registers its view with the editor store. */
export function CodeEditor({ initialCode, onEvaluate, onStop, ariaLabel = 'Strudel code' }: Props) {
  const host = useRef<HTMLDivElement>(null);
  // Keep the latest callbacks without recreating the editor.
  const handlers = useRef({ onEvaluate, onStop });
  useEffect(() => {
    handlers.current = { onEvaluate, onStop };
  });

  useEffect(() => {
    const { setView, setCode } = useEditorStore.getState();
    const run = () => {
      handlers.current.onEvaluate();
      return true;
    };
    const stop = () => {
      handlers.current.onStop();
      return true;
    };
    const view = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: initialCode,
        extensions: [
          Prec.highest(
            keymap.of([
              { key: 'Mod-Enter', run },
              { key: 'Alt-Enter', run },
              { key: 'Mod-.', run: stop },
            ]),
          ),
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          history(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          javascript(),
          strudelTheme,
          playingHighlight,
          codeTerms,
          guiEditHighlight,
          errorLine,
          EditorView.contentAttributes.of({ 'aria-label': ariaLabel }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) setCode(u.state.doc.toString());
          }),
        ],
      }),
    });
    setView(view);
    setCode(initialCode);
    return () => {
      setView(null);
      view.destroy();
    };
    // The editor is created once per mount; later code changes go through the store.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div
      ref={host}
      className="min-w-0 [&_.cm-editor]:min-h-40 [&_.cm-editor.cm-focused]:outline-2! [&_.cm-editor.cm-focused]:outline-accent! [&_.cm-editor.cm-focused]:outline-solid!"
    />;
}
