'use client';

import { cn, type ButtonProps } from '@heroui/react';
import type { ReactNode } from 'react';
import { TipButton } from '@/components/ui/TipButton';

export type LedColor = 'off' | 'green' | 'amber' | 'red' | 'purple' | 'blink';

/** A hardware push button (raised cap) with an optional LED and a shortcut hint. */
export function HwButton({
  led,
  keys,
  className,
  children,
  size = 'md',
  ...rest
}: Omit<ButtonProps, 'variant' | 'size' | 'children'> & { children?: ReactNode; tip?: ReactNode; led?: LedColor; keys?: ReactNode; size?: 'sm' | 'md' }) {
  return (
    <TipButton
      variant="ghost"
      size="sm"
      className={cn(
        'hw-btn min-w-0 rounded-[5px] font-sans font-semibold tracking-[0.04em] text-hw-ink uppercase hover:bg-transparent hover:text-hw-ink data-[hovered]:bg-transparent',
        size === 'md' ? 'h-8 gap-2 px-3 text-xs md:h-8' : 'h-6 gap-1.5 px-2 text-[10px] md:h-6',
        className,
      )}
      {...rest}
    >
      {led && <Led color={led} />}
      {children}
      {keys && <kbd className="font-mono text-[10px] font-normal tracking-normal text-hw-muted normal-case">{keys}</kbd>}
    </TipButton>
  );
}

/** A small round LED. */
export function Led({ color, className }: { color: LedColor; className?: string }) {
  return <i className={cn('hw-led', className)} data-lit={color === 'off' ? undefined : color} aria-hidden="true" />;
}

/** Labelled LEDs in a row ("GUI · custom · error"). */
export function StatusLeds({ items }: { items: { label: string; color: LedColor; title?: string }[] }) {
  return (
    <span className="flex gap-2.5">
      {items.map((it) => (
        <span key={it.label} className="flex flex-col items-center gap-0.5 text-[9px] tracking-[0.06em] text-hw-muted uppercase" title={it.title}>
          <Led color={it.color} className="h-2.5 w-2.5" />
          {it.label}
        </span>
      ))}
    </span>
  );
}
