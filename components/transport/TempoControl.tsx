'use client';

import { useRef, useState } from 'react';
import { SegDisplay } from '@/components/hw/Displays';
import { HwButton } from '@/components/hw/HwButton';
import { runGuiEdit, useModelStore } from '@/lib/stores/model';
import { setTempo } from '@/lib/sync/generate';

const MIN = 40;
const MAX = 220;

/**
 * The tempo display: seven-segment BPM with ▲/▼ steppers; click the digits to type a value.
 * Writes `setcpm(BPM/4)` into the code.
 */
export function TempoControl() {
  const tempo = useModelStore((s) => s.model.tempo);
  const bpm = tempo?.bpm;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const custom = !!tempo && tempo.status !== 'gui';
  const write = (n: number) => n >= MIN && n <= MAX && n !== bpm && runGuiEdit((m) => setTempo(m, n));
  const commit = () => {
    const n = Number(draft);
    if (Number.isFinite(n)) write(Math.round(n * 10) / 10);
    setEditing(false);
  };
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5">
        {editing ? (
          <input
            ref={input}
            autoFocus
            className="hw-seg h-[34px] w-[92px] px-2 text-[22px] text-white outline-none focus:border-led"
            value={draft}
            inputMode="decimal"
            aria-label="Tempo in BPM"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') setEditing(false);
            }}
          />
        ) : (
          <button
            type="button"
            className="cursor-text rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-led"
            aria-label={custom ? 'Tempo: set by custom code' : bpm ? `Tempo ${bpm} BPM. Press to type a value` : 'Tempo not set. Press to type a value'}
            disabled={custom}
            title={custom ? 'The tempo line is custom code: edit it in the editor' : undefined}
            onClick={() => {
              setDraft(bpm ? String(bpm) : '');
              setEditing(true);
            }}
          >
            <SegDisplay value={custom ? '----' : bpm ? bpm.toFixed(1) : '---.-'} className="w-[92px]" />
          </button>
        )}
        <div className="flex flex-col gap-0.5">
          <HwButton size="sm" className="h-4 px-1.5 text-[9px] md:h-4" aria-label="Tempo up" isDisabled={custom || !bpm} onPress={() => bpm && write(bpm + 1)}>
            ▲
          </HwButton>
          <HwButton size="sm" className="h-4 px-1.5 text-[9px] md:h-4" aria-label="Tempo down" isDisabled={custom || !bpm} onPress={() => bpm && write(bpm - 1)}>
            ▼
          </HwButton>
        </div>
      </div>
      <span className="text-[10px] tracking-[0.08em] text-hw-muted uppercase">{custom ? 'tempo · custom' : 'tempo · bpm'}</span>
    </div>
  );
}
