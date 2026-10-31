'use client';

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { TipButton } from '@/components/ui/TipButton';
import { Panel } from '@/components/ui/Panel';
import type { AudioEngine } from '@/lib/audio/engine';
import { isMac } from '@/lib/platform';

interface Props {
  engine: AudioEngine | null;
  playing: boolean;
  loading: boolean;
  loadError: string | null;
  onPlay(): void;
  onStop(): void;
  /** Tempo control, supplied by the page once the code is parsed. */
  tempo?: ReactNode;
}

/** Play / Stop and the current position (1 cycle = 1 bar of 4 beats). */
export function Transport({ engine, playing, loading, loadError, onPlay, onStop, tempo }: Props) {
  const position = usePosition(engine);
  const mod = useIsMacKeyboard() ? '⌘' : 'Ctrl+';
  return (
    <Panel className="flex-row flex-wrap items-center gap-3">
      <TipButton
        size="sm"
        className="bg-success text-success-foreground"
        onPress={onPlay}
        isDisabled={!engine}
        tip={engine ? `Run the code (${mod}Enter)` : 'Loading the audio engine…'}
      >
        {playing ? '⟳ Update' : '▶ Play'} <ShortcutKey>{mod}↵</ShortcutKey>
      </TipButton>
      <TipButton size="sm" variant="secondary" onPress={onStop} isDisabled={!playing} tip={playing ? `Stop (${mod}.)` : 'Nothing is playing'}>
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
