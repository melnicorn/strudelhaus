import { cn } from '@heroui/react';
import type { ReactNode } from 'react';

/** Underlined inline text link (prose, footer, table cells). */
export const linkClass = 'underline underline-offset-2 hover:text-accent';

/** A plain bordered box, for elements Panel can't be (links, <aside>, <article>, <dl>). */
export const boxClass = 'min-w-0 rounded-lg border border-border bg-surface p-3';

interface Props {
  /** Page heading (h1). */
  title?: ReactNode;
  /** Paragraph under the heading. */
  intro?: ReactNode;
  /** Larger intro text (the home page). */
  lede?: boolean;
  /** Tool pages (sandbox, lessons, sounds): the whole window instead of a 1280px column. */
  wide?: boolean;
  children?: ReactNode;
}

/** The standard page shell: a centred column (or the whole window for tool pages) with an optional heading and intro. */
export function Page({ title, intro, lede, wide, children }: Props) {
  return (
    <main className={cn('mx-auto w-full p-4', !wide && 'max-w-7xl')}>
      {title && <h1 className="mt-1 mb-3 text-[1.75rem] leading-tight font-bold">{title}</h1>}
      {intro && <p className={cn('mb-4', lede && 'max-w-[720px] text-base')}>{intro}</p>}
      {children}
    </main>
  );
}
