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

/** A 16-step grid (one bar of 16th notes), grouped by beat, with a playhead. */
export function StepGrid({ steps, rows, readOnly, onToggle, label, rowLabel = (r) => r, rowChoices, onRename, onBrowse }: Props) {
  const now = usePlayStep();
  return (
    <div className="flex flex-col gap-1" role="group" aria-label={label ?? 'step grid'}>
      {rows.map((row) => (
        <div className="grid grid-cols-[60px_repeat(4,minmax(0,1fr))] items-center gap-1.5" key={row}>
          {rowChoices && onRename ? (
            // The trigger shows just the short name; the list shows full labels.
            <span title={rowLabel(row)} className="min-w-0">
              <SimpleSelect
                value={row}
                aria-label={`Change the ${row} row's sound`}
                renderValue={(v) => v}
                className="w-full min-w-0"
                triggerClassName="min-h-6 h-6 gap-0.5 px-1 font-mono text-xs"
                onChange={(v) => (v === BROWSE ? onBrowse?.(row) : onRename(row, v))}
                options={[
                  // Other rows' sounds are left out, so a swap never merges two rows.
                  ...[...new Set([row, ...rowChoices])].filter((c) => c === row || !rows.includes(c)).map((c) => ({ value: c, label: rowLabel(c) })),
                  ...(onBrowse ? [{ value: BROWSE, label: 'Browse sounds…' }] : []),
                ]}
              />
            </span>
          ) : (
            <span className="truncate font-mono text-xs text-muted" title={rowLabel(row)}>
              {row}
            </span>
          )}
          {[0, 1, 2, 3].map((beat) => (
            <div className="grid grid-cols-4 gap-[3px]" key={beat}>
              {[0, 1, 2, 3].map((k) => {
                const i = beat * 4 + k;
                const on = steps[i] === row;
                return (
                  <button
                    key={i}
                    aria-pressed={on}
                    aria-label={`${row} step ${i + 1}`}
                    className={cn(
                      'h-6 min-w-0 cursor-pointer rounded-[3px] border p-0',
                      on ? 'border-accent bg-accent' : 'border-border bg-default',
                      now === i && 'ring-2 ring-success',
                      readOnly && 'cursor-default opacity-75',
                    )}
                    disabled={readOnly}
                    onClick={() => onToggle?.(row, i)}
                  />
                );
              })}
            </div>
          ))}
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
