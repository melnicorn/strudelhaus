'use client';

import { cn } from '@heroui/react';
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
import { agentChanges, agentStack } from '@/lib/assistant/agentEdits';
import { autocomplete, autocompleteCompartment } from '@/lib/editor/autocomplete';
import { errorLine } from '@/lib/editor/errorLine';
import { guiEditHighlight } from '@/lib/editor/guiEdits';
import { playingHighlight } from '@/lib/editor/playingHighlight';
import { codeTerms } from '@/lib/editor/terms';
import { strudelTheme } from '@/lib/editor/theme';
import { useEditorStore } from '@/lib/stores/editor';
import { useSettingsStore } from '@/lib/stores/settings';

interface Props {
  initialCode: string;
  /** Ctrl/Cmd+Enter: play or pause. */
  onToggle(): void;
  /** Shift+Ctrl/Cmd+Enter or Alt+Enter: run the changed code without stopping. */
  onUpdate(): void;
  /** Ctrl/Cmd+.: stop and go back to bar 1. */
  onStop(): void;
  ariaLabel?: string;
  /** Extra classes on the host, e.g. a `[&_.cm-editor]:max-h-…` cap (the editor scrolls inside). */
  className?: string;
}

/** The Strudel code editor. Registers its view with the editor store. */
export function CodeEditor({ initialCode, onToggle, onUpdate, onStop, ariaLabel = 'Strudel code', className }: Props) {
  const host = useRef<HTMLDivElement>(null);
  // Keep the latest callbacks without recreating the editor.
  const handlers = useRef({ onToggle, onUpdate, onStop });
  useEffect(() => {
    handlers.current = { onToggle, onUpdate, onStop };
  });

  const completions = useSettingsStore((s) => s.settings.autocomplete);
  useEffect(() => {
    useEditorStore.getState().view?.dispatch({ effects: autocompleteCompartment.reconfigure(autocomplete(completions)) });
  }, [completions]);

  useEffect(() => {
    const { setView, setCode, setSelection, setAgentUndo } = useEditorStore.getState();
    const bind = (name: 'onToggle' | 'onUpdate' | 'onStop') => () => {
      handlers.current[name]();
      return true;
    };
    const view = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: initialCode,
        extensions: [
          Prec.highest(
            keymap.of([
              { key: 'Shift-Mod-Enter', run: bind('onUpdate') },
              { key: 'Mod-Enter', run: bind('onToggle') },
              { key: 'Alt-Enter', run: bind('onUpdate') },
              { key: 'Mod-.', run: bind('onStop') },
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
          autocompleteCompartment.of(autocomplete(useSettingsStore.getState().settings.autocomplete)),
          strudelTheme,
          playingHighlight,
          codeTerms,
          guiEditHighlight,
          agentChanges,
          errorLine,
          EditorView.contentAttributes.of({ 'aria-label': ariaLabel }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) setCode(u.state.doc.toString());
            // The stack is re-mapped on every edit; only tell React when entries come or go.
            const undo = agentStack(u.state);
            const before = agentStack(u.startState);
            if (undo.length !== before.length || undo.at(-1)?.id !== before.at(-1)?.id) setAgentUndo(undo.map((c) => c.summary));
            if (u.selectionSet || u.docChanged) {
              const { from, to } = u.state.selection.main;
              setSelection(from === to ? null : { from, to });
            }
          }),
        ],
      }),
    });
    setView(view);
    setCode(initialCode);
    setSelection(null);
    setAgentUndo([]);
    return () => {
      setView(null);
      setSelection(null);
      setAgentUndo([]);
      view.destroy();
    };
    // The editor is created once per mount; later code changes go through the store.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={host}
      className={cn(
        'min-w-0 [&_.cm-editor]:min-h-40 [&_.cm-editor.cm-focused]:outline-2! [&_.cm-editor.cm-focused]:outline-accent! [&_.cm-editor.cm-focused]:outline-solid! [&_.cm-scroller]:overflow-auto',
        className,
      )}
    />
  );
}
