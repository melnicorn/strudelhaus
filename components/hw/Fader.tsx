'use client';

import { cn } from '@heroui/react';
import { useRef } from 'react';
import { mergeProps, useFocusRing, useNumberFormatter, useSlider, useSliderThumb, VisuallyHidden } from 'react-aria';
import { useSliderState } from 'react-stately';
import { useDraft } from '@/lib/hooks/useDraft';
import { formatValue, parseValue, type Unit } from './format';
import { snap } from './scale';
import { Readout } from './Readout';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  unit?: Unit;
  onChange(v: number): void;
  isDisabled?: boolean;
  /** Scale marks beside the slot, top to bottom. */
  marks?: string[];
  className?: string;
}

/** A vertical level fader (mixer strips): drag the cap or click the slot; keyboard steps it. */
export function Fader({ label, value, min, max, step = 0.01, defaultValue, unit = 'number', onChange, isDisabled, marks, className }: Props) {
  const [draft, setDraft] = useDraft(value);
  const commit = (v: number) => v !== value && onChange(v);
  const formatter = useNumberFormatter({ maximumFractionDigits: 3 });
  const state = useSliderState({
    numberFormatter: formatter,
    orientation: 'vertical',
    minValue: min,
    maxValue: max,
    step,
    value: [draft],
    onChange: ([v]) => setDraft(v),
    onChangeEnd: ([v]) => commit(v),
    isDisabled,
  });
  const trackRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { groupProps, trackProps, labelProps } = useSlider({ 'aria-label': label, orientation: 'vertical', isDisabled }, state, trackRef);
  const { thumbProps, inputProps } = useSliderThumb({ index: 0, trackRef, inputRef, 'aria-label': label, isDisabled }, state);
  const { focusProps, isFocusVisible } = useFocusRing();
  const top = `${(1 - state.getThumbPercent(0)) * 100}%`;
  const atDefault = defaultValue !== undefined && Math.abs(draft - defaultValue) < 1e-9;
  return (
    <div {...groupProps} className={cn('inline-flex flex-col items-center gap-1', isDisabled && 'opacity-50', className)}>
      <div className="relative flex gap-1">
        <div
          {...trackProps}
          ref={trackRef}
          className={cn('relative h-28 w-7 touch-none', !isDisabled && 'cursor-ns-resize')}
          onDoubleClick={() => defaultValue !== undefined && !isDisabled && commit(defaultValue)}
        >
          <div className="absolute inset-y-0 left-[11px] w-1 rounded-sm bg-[#0d0c0a] shadow-[inset_0_0_0_1px_#000]" />
          <div
            {...thumbProps}
            style={{ top }}
            className={cn(
              'absolute left-0 h-4 w-7 -translate-y-1/2 rounded-[3px] border border-black bg-linear-to-b from-[#56534c] to-[#2b2a26]',
              "after:absolute after:inset-x-[3px] after:top-[7px] after:h-0.5 after:bg-[#ddd] after:content-['']",
              isFocusVisible && 'outline-2 outline-offset-1 outline-led',
            )}
          >
            <VisuallyHidden>
              <input ref={inputRef} {...mergeProps(inputProps, focusProps)} />
            </VisuallyHidden>
          </div>
        </div>
        {marks && (
          <div className="relative h-28 w-5 font-mono text-[8px] text-hw-muted" aria-hidden="true">
            {marks.map((m, i) => (
              <span key={i} className="absolute left-0 -translate-y-1/2" style={{ top: `${(i / (marks.length - 1)) * 100}%` }}>
                {m}
              </span>
            ))}
          </div>
        )}
      </div>
      <Readout
        text={formatValue(draft, unit)}
        dim={atDefault}
        isDisabled={isDisabled}
        focusAfter={inputRef}
        aria-label={label}
        onCommit={(raw) => {
          const v = parseValue(raw, unit);
          if (v === null) return false;
          commit(snap({ min, max, step }, v));
          return true;
        }}
      />
      <span {...labelProps} className="max-w-20 truncate text-center font-mono text-[11px] font-semibold text-hw-ink">
        {label}
      </span>
    </div>
  );
}
