'use client';

import { cn } from '@heroui/react';
import type { ReactNode } from 'react';

/** The caption under a hardware control. */
export function Caption({ children, className, title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <span className={cn('text-center text-[10px] tracking-[0.08em] text-hw-muted uppercase', className)} title={title}>
      {children}
    </span>
  );
}

interface SlideProps {
  label: string;
  value: string;
  options: readonly string[];
  /** Shown on the switch instead of the value. */
  format?(option: string): string;
  onChange(v: string): void;
  isDisabled?: boolean;
  caption?: ReactNode;
}

/** A slide switch for a few fixed choices (filter type, Steps/Mini). Arrow keys move it. */
export function SlideSwitch({ label, value, options, format = (o) => o, onChange, isDisabled, caption }: SlideProps) {
  const move = (d: number) => {
    const i = options.indexOf(value);
    const next = options[Math.min(options.length - 1, Math.max(0, i + d))];
    if (next !== undefined && next !== value) onChange(next);
  };
  return (
    <div className={cn('inline-flex flex-col items-center gap-1', isDisabled && 'opacity-50')}>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex rounded border border-black bg-[#0f0e0c] p-0.5"
        onKeyDown={(e) => {
          const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          move(d);
        }}
      >
        {options.map((o) => {
          const on = o === value;
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={on}
              tabIndex={on ? 0 : -1}
              disabled={isDisabled}
              className={cn(
                'cursor-pointer rounded-[3px] px-2 py-1 font-sans text-[10px] font-semibold tracking-[0.05em] uppercase focus-visible:outline-2 focus-visible:outline-led',
                on ? 'bg-linear-to-b from-hw-cap-hi to-hw-cap text-hw-ink shadow-[0_1px_0_#000]' : 'text-hw-muted',
              )}
              onClick={() => !on && onChange(o)}
            >
              {format(o)}
            </button>
          );
        })}
      </div>
      {caption !== null && <Caption>{caption ?? label}</Caption>}
    </div>
  );
}

interface ToggleProps {
  label: string;
  isOn: boolean;
  onChange(on: boolean): void;
  isDisabled?: boolean;
  caption?: ReactNode;
}

/** A two-position switch: down is on. */
export function ToggleSwitch({ label, isOn, onChange, isDisabled, caption }: ToggleProps) {
  return (
    <div className={cn('inline-flex flex-col items-center gap-1', isDisabled && 'opacity-50')}>
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-label={label}
        disabled={isDisabled}
        className={cn(
          'relative h-10 w-5 cursor-pointer rounded border border-black bg-[#0f0e0c] focus-visible:outline-2 focus-visible:outline-led',
          "after:absolute after:inset-x-[3px] after:h-4 after:rounded-sm after:border after:border-black after:bg-linear-to-b after:from-[#56534c] after:to-[#2b2a26] after:content-['']",
          isOn ? 'shadow-[0_0_0_1px_#1f3a24] after:bottom-[3px]' : 'after:top-[3px]',
        )}
        onClick={() => onChange(!isOn)}
      />
      <Caption>{caption ?? label}</Caption>
    </div>
  );
}
