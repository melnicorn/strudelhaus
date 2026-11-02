'use client';

import { cn } from '@heroui/react';
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { BeatLeds, HW_SURFACE, Lcd, SegDisplay } from '@/components/hw/Displays';
import { HwButton } from '@/components/hw/HwButton';
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

/** The transport strip: Play/Pause, Update, Stop, tempo, bar · beat (1 cycle = 1 bar of 4 beats). */
export function Transport({ engine, state, loading, loadError, onToggle, onUpdate, onStop, tempo }: Props) {
  const position = usePosition(engine);
  const mac = useIsMacKeyboard();
  const mod = mac ? '⌘' : 'Ctrl+';
  const playing = state === 'playing';
  const pausedBar = state === 'paused' ? engine?.pausedBar() : undefined;
  const bar = playing && position ? position.bar : (pausedBar ?? 0);
  const beat = playing && position ? position.beat : 0;
  return (
    <div className={cn(HW_SURFACE, 'flex flex-wrap items-end gap-x-5 gap-y-3 px-3.5 py-3')} role="group" aria-label="Transport">
      <div className="flex flex-col items-center gap-1">
        <div className="flex gap-2">
          <HwButton
            led={playing ? 'green' : pausedBar ? 'blink' : 'off'}
            keys={`${mod}↵`}
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
            {playing ? '❚❚ Pause' : '▶ Play'}
          </HwButton>
          <HwButton led="off" keys={mac ? '⇧⌘↵' : 'Ctrl+⇧↵'} onPress={onUpdate} isDisabled={state === 'stopped'} tip={state === 'stopped' ? 'Play first' : 'Run the changed code without stopping'}>
            ⟳ Update
          </HwButton>
          <HwButton
            led={state === 'stopped' ? 'amber' : 'off'}
            keys={`${mod}.`}
            onPress={onStop}
            isDisabled={state === 'stopped'}
            tip={state === 'stopped' ? 'Nothing is playing' : `Stop and go back to bar 1 (${mod}.)`}
          >
            ■ Stop
          </HwButton>
        </div>
        <span className="text-[10px] tracking-[0.08em] text-hw-muted uppercase">transport</span>
      </div>
      {tempo}
      <div className="flex flex-col items-center gap-1">
        <SegDisplay size="sm" width={4} value={bar ? `${String(bar).padStart(3, '0')}.${beat || '-'}` : '---.-'} className="w-[62px]" />
        <span className="text-[10px] tracking-[0.08em] text-hw-muted uppercase">bar · beat</span>
      </div>
      <div className="flex flex-col items-center gap-2 self-center">
        <BeatLeds beat={beat} />
        <span className="text-[10px] tracking-[0.08em] text-hw-muted uppercase">beat</span>
      </div>
      <Lcd className="ml-auto max-w-full" tone={loadError ? 'amber' : 'green'} aria-live="off">
        {loadError ? `Could not load audio: ${loadError}` : loading ? 'loading sounds…' : playing ? 'playing' : pausedBar ? `paused · bar ${pausedBar}` : 'stopped'}
      </Lcd>
    </div>
  );
}

const noSubscribe = () => () => {};

/** Mac keyboards say ⌘ where others say Ctrl (false during server render). */
function useIsMacKeyboard() {
  return useSyncExternalStore(noSubscribe, isMac, () => false);
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
