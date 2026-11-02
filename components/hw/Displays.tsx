'use client';

import { cn } from '@heroui/react';
import type { ReactNode } from 'react';

/** Seven-segment digits ("124.0"). `width` is the number of character cells drawn as ghosts. */
export function SegDisplay({ value, width = 5, size = 'md', className, title }: { value: string; width?: number; size?: 'sm' | 'md'; className?: string; title?: string }) {
  return (
    <span className={cn('hw-seg', size === 'md' ? 'px-2 py-1 text-[22px]' : 'px-1.5 py-1 text-sm', className)} title={title} aria-hidden="true">
      <span className="ghost">{'8'.repeat(width - 1) + '.8'}</span>
      <span className="lit">{value}</span>
    </span>
  );
}

/** The green LCD line (a pattern, a name, "paused · bar 3"). */
export function Lcd({ children, className, tone = 'green', ...rest }: { children: ReactNode; className?: string; tone?: 'green' | 'amber' | 'purple'; title?: string; 'aria-live'?: 'off' | 'polite' }) {
  return (
    <span
      className={cn(
        'hw-lcd inline-block min-w-0 truncate px-2 py-1 text-xs',
        tone === 'amber' && 'bg-[#2a1d10] text-led [text-shadow:none]',
        tone === 'purple' && 'bg-[#1e1530] text-custom [text-shadow:none]',
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

/** Four beat LEDs; `beat` is 1–4 or 0 for none. */
export function BeatLeds({ beat }: { beat: number }) {
  return (
    <span className="flex gap-1.5" aria-hidden="true">
      {[1, 2, 3, 4].map((b) => (
        <i key={b} className="hw-led h-2.5 w-2.5" data-lit={beat === b ? 'amber' : undefined} />
      ))}
    </span>
  );
}

/** A labelled group on a hardware surface: the control(s) with a caption underneath. */
export function HwGroup({ caption, children, className }: { caption: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-1.5', className)}>
      <div className="flex items-center gap-2">{children}</div>
      <span className="text-[10px] tracking-[0.08em] text-hw-muted uppercase">{caption}</span>
    </div>
  );
}

/** Classes for a dark instrument surface. The `dark` class flips HeroUI's colours inside it. */
export const HW_SURFACE = 'dark rounded-lg border border-hw-line bg-hw text-hw-ink select-none';
