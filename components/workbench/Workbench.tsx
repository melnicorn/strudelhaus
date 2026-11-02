'use client';

import { Checkbox, cn, Label, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { ErrorPanel } from '@/components/errors/ErrorPanel';
import { TempoControl } from '@/components/transport/TempoControl';
import { Transport } from '@/components/transport/Transport';
import { useEngine, usePlayState } from '@/components/transport/useEngine';
import type { StrudelPattern } from '@/lib/audio/engine';
import { setErrorLine } from '@/lib/editor/errorLine';
import { showActiveHaps, updateMiniLocations } from '@/lib/editor/playingHighlight';
import { friendlyEvalError, friendlyRuntimeMessage, type FriendlyError } from '@/lib/errors/friendly';
import { useEditorStore } from '@/lib/stores/editor';
import { useSettingsStore } from '@/lib/stores/settings';
import { setAfterGuiEdit } from '@/lib/stores/model';

interface Props {
  initialCode: string;
  /** Called after each successful evaluation (lesson checks, visualisation). */
  onEvaluated?(pattern: StrudelPattern, code: string): void;
  /** GUI panels, shown beside the editor on wide screens. */
  panels?: ReactNode;
  /** Shown under the editor (visualisation). */
  children?: ReactNode;
}

/** Transport + code editor + errors: the core of the lesson and sandbox views. */
export function Workbench({ initialCode, onEvaluated, panels, children }: Props) {
  const { engine, loadError } = useEngine();
  const playState = usePlayState(engine);
  const playing = playState === 'playing';
  const [error, setError] = useState<FriendlyError | null>(null);
  const [runtimeError, setRuntimeError] = useState<FriendlyError | null>(null);
  const onEvaluatedRef = useRef(onEvaluated);
  useEffect(() => {
    onEvaluatedRef.current = onEvaluated;
  });

  const evaluate = useCallback(async () => {
    if (!engine) return;
    const { view, code } = useEditorStore.getState();
    await engine.unlock();
    const result = await engine.evaluate(code);
    if (result.ok) {
      setError(null);
      setRuntimeError(null);
      view?.dispatch({ effects: setErrorLine.of(null) });
      onEvaluatedRef.current?.(result.pattern, code);
    } else {
      const friendly = friendlyEvalError(result.error.message, result.error.line);
      setError(friendly);
      view?.dispatch({ effects: setErrorLine.of(friendly.line ?? null) });
    }
  }, [engine]);

  const stop = useCallback(() => engine?.stop(), [engine]);
  // ⌘↵: pause while playing; otherwise play. After a pause, unchanged code continues where it
  // was; changed code is re-run (also from where it was).
  const toggle = useCallback(async () => {
    if (!engine) return;
    if (engine.isPlaying()) return engine.pause();
    if (engine.playState() === 'paused' && engine.lastCode() === useEditorStore.getState().code) return engine.resume();
    await evaluate();
  }, [engine, evaluate]);

  // GUI edits re-run the code while it's playing, so changes are heard straight away.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    setAfterGuiEdit(() => {
      if (!engine?.isPlaying()) return;
      clearTimeout(timer);
      timer = setTimeout(evaluate, 80);
    });
    return () => {
      clearTimeout(timer);
      setAfterGuiEdit(null);
    };
  }, [engine, evaluate]);

  // Playing-note highlighting: map evaluated mini-notation ranges, then outline active ones per frame.
  useEffect(() => {
    if (!engine) return;
    const offEval = engine.onEvaluated(({ code, miniLocations }) => {
      const { view } = useEditorStore.getState();
      // Ranges only make sense if the editor still holds the code that was evaluated.
      if (view) updateMiniLocations(view, view.state.doc.toString() === code ? miniLocations : []);
    });
    let lastKey = '';
    const offFrame = engine.onFrame((haps) => {
      const { view } = useEditorStore.getState();
      if (!view) return;
      const key = haps.map((h) => h.context?.locations?.map((l) => l.start).join(',')).join('|');
      if (key === lastKey) return;
      lastKey = key;
      showActiveHaps(view, haps);
    });
    const offLog = engine.onLog(({ message }) => {
      const friendly = friendlyRuntimeMessage(message, engine.soundNames);
      if (friendly) setRuntimeError(friendly);
    });
    return () => {
      offEval();
      offFrame();
      offLog();
    };
  }, [engine]);

  // Ctrl/Cmd+Enter plays or pauses, with Shift it updates, and Ctrl/Cmd+. stops, from anywhere on
  // the page (the editor has its own keymap for the same keys).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || (e.target as HTMLElement)?.closest?.('.cm-editor')) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        void (e.shiftKey ? evaluate() : toggle());
      } else if (e.key === '.') {
        e.preventDefault();
        stop();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [evaluate, toggle, stop]);

  // Stop when leaving the page (also runs when Next hides the page with <Activity>).
  useEffect(() => () => void engine?.stop(), [engine]);

  const autocomplete = useSettingsStore((s) => s.settings.autocomplete);
  const layout = useSettingsStore((s) => s.settings.layout);
  const setSetting = useSettingsStore((s) => s.set);
  useEffect(() => useSettingsStore.getState().load(), []);
  const side = !!panels && layout === 'side';

  return (
    <div
      className={
        side
          ? 'grid min-w-0 grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start gap-4 max-[960px]:grid-cols-[minmax(0,1fr)]'
          : 'flex min-w-0 flex-col gap-3'
      }
    >
      <div className={cn('flex min-w-0 flex-col gap-3', side && 'sticky top-2 max-[960px]:static')}>
        <Transport
          engine={engine}
          state={playState}
          loading={!engine && !loadError}
          loadError={loadError}
          onToggle={toggle}
          onUpdate={evaluate}
          onStop={stop}
          tempo={<TempoControl />}
        />
        <CodeEditor initialCode={initialCode} onToggle={toggle} onUpdate={evaluate} onStop={stop} />
        <div className="-mt-1.5 flex items-center justify-end gap-4">
          {panels && (
            // Controls beside the code (for wide screens) or under it (more room for knobs).
            <ToggleButtonGroup
              size="sm"
              selectionMode="single"
              disallowEmptySelection
              aria-label="Layout"
              selectedKeys={new Set([layout])}
              onSelectionChange={(keys) => {
                const next = [...keys][0];
                if (next === 'side' || next === 'stacked') setSetting('layout', next);
              }}
            >
              <ToggleButton id="side" className="h-6 px-2 text-xs md:h-6" aria-label="Controls beside the code">
                ◫ Side by side
              </ToggleButton>
              <ToggleButton id="stacked" className="h-6 px-2 text-xs md:h-6" aria-label="Controls under the code">
                <ToggleButtonGroup.Separator />⊟ Stacked
              </ToggleButton>
            </ToggleButtonGroup>
          )}
          <Checkbox isSelected={autocomplete} onChange={(on) => setSetting('autocomplete', on)}>
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Label className="text-xs text-muted">Autocomplete</Label>
            </Checkbox.Content>
          </Checkbox>
        </div>
        <ErrorPanel
          error={error}
          runtimeError={runtimeError}
          playing={playing}
          onDismissRuntime={() => setRuntimeError(null)}
        />
        {children}
      </div>
      {panels && <div className="min-w-0">{panels}</div>}
    </div>
  );
}
