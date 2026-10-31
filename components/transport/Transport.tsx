'use client';

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { TipButton } from '@/components/ui/TipButton';
import { Panel } from '@/components/ui/Panel';
import type { AudioEngine, PlayState } from '@/lib/audio/engine';
import { isMac } from '@/lib/platform';

interface Props {
  engine: AudioEngine | null;
  state: PlayState;
  loading: boolean;
  loadError: string | null;
  /** Play, or pause while playing. */
  onToggle(): void;
  /** Run the changed code without stopping. */
  onUpdate(): void;
  /** Stop and go back to bar 1. */
  onStop(): void;
  /** Tempo control, supplied by the page once the code is parsed. */
  tempo?: ReactNode;
}

/** Play/Pause, Update, Stop and the current position (1 cycle = 1 bar of 4 beats). */
export function Transport({ engine, state, loading, loadError, onToggle, onUpdate, onStop, tempo }: Props) {
  const position = usePosition(engine);
  const mac = useIsMacKeyboard();
  const mod = mac ? '⌘' : 'Ctrl+';
  const playing = state === 'playing';
  const pausedBar = state === 'paused' ? engine?.pausedBar() : undefined;
  return (
    <Panel className="flex-row flex-wrap items-center gap-3">
      <TipButton
        size="sm"
        className="bg-success text-success-foreground"
        onPress={onToggle}
        isDisabled={!engine}
        tip={
          !engine
            ? 'Loading the audio engine…'
            : playing
              ? `Pause (${mod}Enter). Play continues from the same beat`
              : pausedBar
                ? `Continue from bar ${pausedBar} (${mod}Enter)`
                : `Run the code (${mod}Enter)`
        }
      >
        {playing ? '❚❚ Pause' : '▶ Play'} <ShortcutKey>{mod}↵</ShortcutKey>
      </TipButton>
      {state !== 'stopped' && (
        <TipButton size="sm" variant="secondary" onPress={onUpdate} tip="Run the changed code without stopping">
          ⟳ Update <ShortcutKey>{mac ? '⇧⌘↵' : 'Ctrl+Shift+↵'}</ShortcutKey>
        </TipButton>
      )}
      <TipButton
        size="sm"
        variant="secondary"
        onPress={onStop}
        isDisabled={state === 'stopped'}
        tip={state === 'stopped' ? 'Nothing is playing' : `Stop and go back to bar 1 (${mod}.)`}
      >
        ■ Stop <ShortcutKey>{mod}.</ShortcutKey>
      </TipButton>
      {tempo}
      <span className="ml-auto font-mono text-[13px] text-muted" aria-live="off">
        {loadError
          ? `Could not load audio: ${loadError}`
          : loading
            ? 'loading sounds…'
            : playing && position
              ? `bar ${position.bar} · beat ${position.beat}`
              : pausedBar
                ? `paused · bar ${pausedBar}`
                : 'stopped'}
      </span>
    </Panel>
  );
}

/** Shortcut hint inside a button. */
function ShortcutKey({ children }: { children: ReactNode }) {
  return <kbd className="ml-1 font-sans text-[11px] opacity-70">{children}</kbd>;
}

const noSubscribe = () => () => {};

/** Mac keyboards say ⌘ where others say Ctrl (false during server render). */
function useIsMacKeyboard() {
  return useSyncExternalStore(
    noSubscribe,
    isMac,
    () => false,
  );
}

function usePosition(engine: AudioEngine | null) {
  const [pos, setPos] = useState<{ bar: number; beat: number } | null>(null);
  useEffect(() => {
    if (!engine) return;
    let last = '';
    return engine.onFrame((_haps, cycle) => {
      const bar = Math.floor(cycle) + 1;
      const beat = Math.floor((cycle % 1) * 4) + 1;
      const key = `${bar}:${beat}`;
      if (key !== last) {
        last = key;
        setPos({ bar, beat });
      }
    });
  }, [engine]);
  return pos;
}
