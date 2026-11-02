'use client';

import { cn } from '@heroui/react';
import { useEffect, useState } from 'react';
import { SimpleSelect } from '@/components/ui/SimpleSelect';
import { getEngine } from '@/lib/audio/engine';
import type { Steps } from '@/lib/sync/miniGrid';

interface Props {
  steps: Steps;
  /** One row per sound; a step lights in the row whose sound plays there. */
  rows: string[];
  readOnly?: boolean;
  onToggle?(row: string, step: number): void;
  label?: string;
  /** Display text for a row name (e.g. "sd - snare"). */
  rowLabel?(row: string): string;
  /** When given, each row's name is a dropdown of these sounds for swapping it in place. */
  rowChoices?: string[];
  onRename?(from: string, to: string): void;
  /** Adds a "Browse sounds…" entry to each row's list. */
  onBrowse?(row: string): void;
}

const BROWSE = '\u0000browse';

/** The TR-909's four beat colours, one per group of four steps. */
export const PAD_COLORS = ['var(--color-pad-1)', 'var(--color-pad-2)', 'var(--color-pad-3)', 'var(--color-pad-4)'];

/** The trigger of a row-name select, drawn as a small LCD. */
export const LCD_TRIGGER = 'hw-lcd min-h-6 h-6 gap-0.5 rounded px-1.5 font-mono text-[11px] font-semibold shadow-none';

/** A 16-step pad row per sound: one bar of 16th notes, beat-coloured, with a playhead. */
export function StepGrid({ steps, rows, readOnly, onToggle, label, rowLabel = (r) => r, rowChoices, onRename, onBrowse }: Props) {
  const now = usePlayStep();
  return (
    <div className="flex flex-col gap-1" role="group" aria-label={label ?? 'step grid'}>
      <div className="grid grid-cols-[64px_repeat(16,minmax(0,1fr))] gap-1 font-mono text-[9px] text-hw-muted" aria-hidden="true">
        <span />
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i} className={cn('text-center', i % 4 === 0 && 'font-bold text-hw-ink')}>
            {i % 4 === 0 ? i / 4 + 1 : ['e', '&', 'a'][(i % 4) - 1]}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div className="grid grid-cols-[64px_repeat(16,minmax(0,1fr))] items-center gap-1" key={row}>
          {rowChoices && onRename ? (
            // The trigger shows just the short name; the list shows full labels.
            <span title={rowLabel(row)} className="min-w-0">
              <SimpleSelect
                value={row}
                aria-label={`Change the ${row} row's sound`}
                renderValue={(v) => v}
                className="w-full min-w-0"
                triggerClassName={LCD_TRIGGER}
                onChange={(v) => (v === BROWSE ? onBrowse?.(row) : onRename(row, v))}
                options={[
                  // Other rows' sounds are left out, so a swap never merges two rows.
                  ...[...new Set([row, ...rowChoices])].filter((c) => c === row || !rows.includes(c)).map((c) => ({ value: c, label: rowLabel(c) })),
                  ...(onBrowse ? [{ value: BROWSE, label: 'Browse sounds…' }] : []),
                ]}
              />
            </span>
          ) : (
            <span className="hw-lcd h-6 truncate px-1.5 text-[11px] leading-[22px] font-semibold" title={rowLabel(row)}>
              {row}
            </span>
          )}
          {steps.map((s, i) => {
            const on = s === row;
            return (
              <button
                key={i}
                aria-pressed={on}
                aria-label={`${row} step ${i + 1}`}
                data-on={on}
                style={{ '--pad': PAD_COLORS[i >> 2] } as React.CSSProperties}
                className={cn(
                  'hw-pad h-9 min-w-0 cursor-pointer rounded-[3px] p-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-led',
                  now === i && 'outline-2 outline-offset-1 outline-white',
                  readOnly && 'cursor-default opacity-60',
                  i % 4 === 0 && i > 0 && 'ml-1',
                )}
                disabled={readOnly}
                onClick={() => onToggle?.(row, i)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** The 16th-note step playing now (within the bar), or -1 when stopped. */
export function usePlayStep() {
  const [step, setStep] = useState(-1);
  useEffect(() => {
    let off: (() => void) | undefined;
    let cancelled = false;
    getEngine().then((engine) => {
      if (cancelled) return;
      let last = -2;
      off = engine.onFrame((_haps, cycle) => {
        const s = engine.isPlaying() ? Math.floor((cycle % 1) * 16) : -1;
        if (s !== last) setStep((last = s));
      });
    });
    return () => {
      cancelled = true;
      off?.();
    };
  }, []);
  return step;
}
