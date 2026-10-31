'use client';

import { Button, cn, Kbd } from '@heroui/react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { SimpleSelect } from '@/components/ui/SimpleSelect';
import { Hint } from '@/components/ui/Hint';
import { getEngine } from '@/lib/audio/engine';
import { drumLabel, type Machine, type Synth } from '@/lib/sounds/catalog';
import { midiToNote } from '@/lib/sync/notes';

/** The code for one drum sample: `s("bd:2").bank("RolandTR909")`. */
export function drumCode(bank: string, sound: string, n = 0) {
  return `s("${n ? `${sound}:${n}` : sound}")${bank ? `.bank("${bank}")` : ''}`;
}

/** A two-bar groove using whichever kit pieces the machine has. */
export function machineDemo(m: Machine) {
  const has = (s: string) => m.sounds.some(([x]) => x === s);
  const kick = has('bd') ? 'bd*4' : null;
  const back = has('cp') ? '~ cp ~ cp' : has('sd') ? '~ sd ~ sd' : has('rim') ? '~ rim ~ rim' : null;
  const hat = has('hh') ? '[~ hh]*4' : has('oh') ? '[~ oh]*4' : has('rd') ? '[~ rd]*4' : has('sh') ? 'sh*8' : null;
  const layers = [kick, back, hat].filter(Boolean);
  const mini = layers.length ? layers.join(', ') : m.sounds.map(([s]) => s).slice(0, 4).join(' ');
  return `s("${mini}")${m.bank ? `.bank("${m.bank}")` : ''}`;
}

/** Plays snippets through the engine, over whatever is already playing. */
export function useAudition() {
  const [error, setError] = useState<string | null>(null);
  const play = useCallback(async (code: string, bars = 1) => {
    const engine = await getEngine();
    await engine.unlock();
    const result = await engine.audition(code, bars);
    setError(result.ok ? null : result.message);
  }, []);
  return { play, error };
}

interface MachineProps {
  machine: Machine;
  selected?: { sound: string; n: number } | null;
  onPick(sound: string, n: number): void;
  compact?: boolean;
}

/** A drum machine's instruments, each with numbered buttons for its variants. */
export function MachineSounds({ machine, selected, onPick, compact }: MachineProps) {
  return (
    <div>
      {machine.sounds.map(([sound, count]) => (
        <div
          key={sound}
          className={cn(
            'grid items-center border-b border-separator py-1.5 last:border-b-0',
            compact ? 'grid-cols-1 gap-1' : 'grid-cols-[160px_minmax(0,1fr)] gap-2 max-[760px]:grid-cols-1 max-[760px]:gap-1',
          )}
        >
          <div className="font-mono">
            {sound} <span className="font-sans text-xs text-muted">{drumLabel(sound).slice(sound.length)}</span>
          </div>
          <div className="flex flex-wrap gap-1" role="group" aria-label={`${sound} variants`}>
            {Array.from({ length: count }, (_, n) => {
              const isSel = selected?.sound === sound && selected.n === n;
              return (
                <button
                  key={n}
                  className={cn(
                    'h-[26px] w-[30px] cursor-pointer rounded border p-0 font-mono text-xs',
                    isSel ? 'border-accent bg-accent text-accent-foreground' : 'border-border bg-default text-foreground hover:border-accent',
                  )}
                  aria-label={`Play ${sound}:${n}`}
                  onClick={() => onPick(sound, n)}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

const KEY_OFFSETS = ['a', 'w', 's', 'e', 'd', 'f', 't', 'g', 'y', 'h', 'u', 'j', 'k'];
type PlayMode = 'note' | 'chord' | 'line';

export function synthCode(synth: Synth, midi: number, mode: PlayMode) {
  const n = (m: number) => midiToNote(m);
  const s = `.s("${synth.sound}")`;
  if (mode === 'chord') return `note("${[0, 3, 7, 10].map((i) => n(midi + i)).join(',')}")${s}`;
  if (mode === 'line') return `note("${n(midi - 12)} ~ ${n(midi)} ${n(midi - 12)}")${s}`;
  return `note("${n(midi)}")${s}`;
}

/** One octave of piano keys (plus the next C); the computer keyboard plays it too (A W S E D …). */
export function SynthKeys({ synth, onPlay }: { synth: Synth; onPlay(code: string): void }) {
  const [octave, setOctave] = useState(3);
  const [mode, setMode] = useState<PlayMode>('note');
  const [down, setDown] = useState<number | null>(null);
  const base = 12 * (octave + 1); // c3 = 48

  const press = useCallback(
    (offset: number) => {
      setDown(offset);
      onPlay(synthCode(synth, base + offset, mode));
    },
    [synth, base, mode, onPlay],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement)?.closest?.('input, textarea, select, .cm-editor, [role="listbox"], [role="option"], [aria-haspopup]')) return;
      const i = KEY_OFFSETS.indexOf(e.key.toLowerCase());
      if (i >= 0) press(i);
      else if (e.key === 'z') setOctave((o) => Math.max(1, o - 1));
      else if (e.key === 'x') setOctave((o) => Math.min(6, o + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);

  let white = 0;
  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="relative flex h-[120px] flex-none" role="group" aria-label="Keyboard">
        {Array.from({ length: 13 }, (_, i) => {
          const note = midiToNote(base + i);
          const black = /^[a-g]b\d/.test(note);
          const style = black ? { left: white * 38 - 13 } : undefined;
          if (!black) white++;
          return (
            <button
              key={i}
              className={cn(
                'flex cursor-pointer items-end justify-center rounded-b border pb-1 font-mono text-[11px]',
                black ? 'absolute top-0 z-1 h-[74px] w-[26px]' : 'h-[120px] w-[38px]',
                // Piano keys keep their real-world colours in both themes; pressed = accent.
                down === i
                  ? 'border-accent bg-accent text-accent-foreground'
                  : black
                    ? 'border-neutral-900 bg-neutral-900 active:bg-accent'
                    : 'border-neutral-300 bg-white text-neutral-500 active:bg-accent active:text-accent-foreground',
              )}
              style={style}
              aria-label={`Play ${note}`}
              onClick={() => press(i)}
            >
              {black ? '' : note}
            </button>
          );
        })}
      </div>
      <div className="flex max-w-[280px] flex-col gap-2 text-[13px]">
        <div className="flex flex-wrap items-center gap-2">
          <span>Octave</span>
          <Button size="sm" variant="secondary" isIconOnly onPress={() => setOctave((o) => Math.max(1, o - 1))} aria-label="Octave down">
            −
          </Button>
          <span className="font-mono">{octave}</span>
          <Button size="sm" variant="secondary" isIconOnly onPress={() => setOctave((o) => Math.min(6, o + 1))} aria-label="Octave up">
            +
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span>Play</span>
          <SimpleSelect
            aria-label="Play"
            value={mode}
            onChange={(v) => setMode(v as PlayMode)}
            options={[
              { value: 'note', label: 'one note' },
              { value: 'chord', label: 'a minor 7th chord' },
              { value: 'line', label: 'a bassline' },
            ]}
          />
        </div>
        <Hint>
          Your computer keyboard plays too: <K>A</K> <K>W</K> <K>S</K> <K>E</K> <K>D</K> … like a piano; <K>Z</K>/<K>X</K> change
          octave.
        </Hint>
      </div>
    </div>
  );
}

function K({ children }: { children: ReactNode }) {
  return <Kbd className="h-5 px-1.5 font-mono text-xs">{children}</Kbd>;
}
