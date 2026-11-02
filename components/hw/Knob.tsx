'use client';

import { cn } from '@heroui/react';
import { useRef, type ReactNode } from 'react';
import { mergeProps, useFocusRing, useMove, useNumberFormatter, useSlider, useSliderThumb, VisuallyHidden } from 'react-aria';
import { useSliderState } from 'react-stately';
import { useDraft } from '@/lib/hooks/useDraft';
import { formatValue, parseValue, type Unit } from './format';
import { fromPosition, snap, toPosition, type Range } from './scale';
import { Readout } from './Readout';

export interface KnobProps extends Range {
  label: string;
  value: number;
  /** Writes the value: on release, after a keyboard step, or when one is typed. */
  onChange(v: number): void;
  /** Arc drawn from the centre (pan, transpose). */
  bipolar?: boolean;
  /** Double-click goes back to this; the readout dims while on it. */
  defaultValue?: number;
  unit?: Unit;
  size?: 'sm' | 'md';
  isDisabled?: boolean;
  /** Text under the knob; the label by default. */
  caption?: ReactNode;
  className?: string;
}

// The arc runs 270°, from 7 o'clock round to 5 o'clock.
const START = Math.PI * 0.75;
const SWEEP = Math.PI * 1.5;
const C = 32;
const polar = (a: number, r: number) => [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
function arc(a0: number, a1: number, r: number): string {
  if (Math.abs(a1 - a0) < 1e-4) return '';
  const [x0, y0] = polar(a0, r);
  const [x1, y1] = polar(a1, r);
  return `M${x0} ${y0}A${r} ${r} 0 ${Math.abs(a1 - a0) > Math.PI ? 1 : 0} ${a1 > a0 ? 1 : 0} ${x1} ${y1}`;
}

/**
 * A rotary control. Drag up/down (⇧ for fine), ↑/↓ or ←/→ step it, Enter opens the readout to
 * type a value, double-click resets. Built on React Aria's slider state, so it is a slider to
 * the keyboard and to screen readers; the position is logarithmic when `log` is set.
 */
export function Knob({ label, value, onChange, min, max, step, log, bipolar, defaultValue, unit = 'number', size = 'md', isDisabled, caption, className }: KnobProps) {
  const range: Range = { min, max, step, log };
  const [draft, setDraft] = useDraft(value);
  const commit = (v: number) => v !== value && onChange(v);
  // Positions run 0–1000 so arrow keys move in thousandths; the value is derived from them.
  const toState = (v: number) => Math.round(toPosition(range, v) * 1000);
  const fromState = (p: number) => (log ? fromPosition(range, p / 1000) : snap(range, fromPosition(range, p / 1000)));
  const keyStep = log || !step ? 10 : Math.max(1, Math.round((step / (max - min)) * 1000));
  const formatter = useNumberFormatter({ maximumFractionDigits: 3 });
  const state = useSliderState({
    numberFormatter: formatter,
    minValue: 0,
    maxValue: 1000,
    step: keyStep,
    value: [toState(draft)],
    onChange: ([p]) => setDraft(fromState(p)),
    onChangeEnd: ([p]) => commit(fromState(p)),
    isDisabled,
  });
  const trackRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { groupProps, labelProps } = useSlider({ 'aria-label': label, isDisabled }, state, trackRef);
  const { inputProps } = useSliderThumb({ index: 0, trackRef, inputRef, 'aria-label': label, isDisabled }, state);
  const { focusProps, isFocusVisible } = useFocusRing();

  // Vertical drag: 150px for the whole range, 600px with Shift. useMove gives deltas and
  // keeps working when the pointer leaves the knob.
  const pos = useRef(0);
  const { moveProps } = useMove({
    onMoveStart() {
      pos.current = state.getThumbPercent(0);
      state.setThumbDragging(0, true);
      inputRef.current?.focus();
    },
    onMove({ deltaY, shiftKey, pointerType }) {
      if (pointerType === 'keyboard') return;
      pos.current = Math.min(1, Math.max(0, pos.current - deltaY / (shiftKey ? 600 : 150)));
      state.setThumbPercent(0, pos.current);
    },
    onMoveEnd() {
      state.setThumbDragging(0, false);
    },
  });

  const p = toPosition(range, draft);
  const a = START + p * SWEEP;
  const mid = START + SWEEP / 2;
  const [px, py] = polar(a, 14);
  const [qx, qy] = polar(a, 21);
  const detents = step && !log && (max - min) / step <= 24 ? (max - min) / step : 0;
  const atDefault = defaultValue !== undefined && Math.abs(draft - defaultValue) < 1e-9;
  const px_ = size === 'md' ? 56 : 44;

  return (
    <div {...groupProps} className={cn('inline-flex flex-col items-center gap-1', isDisabled && 'opacity-50', className)}>
      <div
        {...(isDisabled ? {} : moveProps)}
        ref={trackRef}
        className={cn('touch-none rounded-full', !isDisabled && 'cursor-ns-resize', isFocusVisible && 'outline-2 outline-offset-2 outline-led')}
        onDoubleClick={() => defaultValue !== undefined && !isDisabled && commit(defaultValue)}
      >
        <svg width={px_} height={px_} viewBox="0 0 64 64" aria-hidden="true" className="block">
          <defs>
            <radialGradient id="hw-cap" cx="40%" cy="35%">
              <stop offset="0" stopColor="#4a4842" />
              <stop offset="1" stopColor="#23221f" />
            </radialGradient>
          </defs>
          <path d={arc(START, START + SWEEP, 27)} stroke="#0f0e0c" strokeWidth="4" fill="none" strokeLinecap="round" />
          {bipolar && <line x1="32" y1="2" x2="32" y2="7" stroke="#6b685f" />}
          {detents > 0 &&
            Array.from({ length: detents + 1 }, (_, i) => {
              const [x, y] = polar(START + (i / detents) * SWEEP, 30);
              return <circle key={i} cx={x} cy={y} r="1" fill="#6b685f" />;
            })}
          <path d={bipolar ? arc(mid, a, 27) : arc(START, a, 27)} stroke="var(--color-led)" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="32" cy="32" r="22" fill="url(#hw-cap)" stroke="#000" />
          <line x1={px} y1={py} x2={qx} y2={qy} stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <VisuallyHidden>
          {/*
           * Arrow keys change the hidden range input natively, which react-aria turns into
           * onChange only; bracketing the key press as a "drag" makes onChangeEnd fire for it
           * too. Stopping propagation keeps useMove (on the knob) from eating the arrows.
           */}
          <input
            ref={inputRef}
            {...mergeProps(inputProps, focusProps, {
              onKeyDown(e: React.KeyboardEvent) {
                e.stopPropagation();
                if (e.key === 'Enter' && !isDisabled) {
                  e.preventDefault();
                  (e.currentTarget.closest('[role=group]')?.querySelector('[data-readout]') as HTMLButtonElement | null)?.click();
                } else if (/^(Arrow|Page|Home|End)/.test(e.key) && !e.repeat) {
                  state.setThumbDragging(0, true);
                }
              },
              onKeyUp(e: React.KeyboardEvent) {
                e.stopPropagation();
                if (/^(Arrow|Page|Home|End)/.test(e.key)) state.setThumbDragging(0, false);
              },
            })}
          />
        </VisuallyHidden>
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
          commit(log ? Math.min(max, Math.max(min, v)) : snap(range, v));
          return true;
        }}
      />
      <span {...labelProps} className="max-w-16 truncate text-center text-[10px] tracking-[0.08em] text-hw-muted uppercase">
        {caption ?? label}
      </span>
    </div>
  );
}
