import type { Route } from 'next';
import Link from 'next/link';
import { cn } from '@heroui/react';
import { boxClass, Page } from '@/components/ui/Page';
import { styles } from '@/lib/styles/load';
import { GROUPS } from '@/lib/styles/types';

export const metadata = { title: 'Styles · Strudel Workshop' };

const chip = 'rounded-full border border-border bg-surface-secondary px-2 py-px text-[11px] whitespace-nowrap';

/** Families in order of their slowest style, each with its styles from slow to fast. */
const families = [...new Set(styles.map((s) => s.family))]
  .map((family) => ({ family, styles: styles.filter((s) => s.family === family).sort((a, b) => a.tempo - b.tempo) }))
  .sort((a, b) => a.styles[0].tempo - b.styles[0].tempo);

export default function StylesPage() {
  return (
    <Page
      title="Styles"
      intro="The sounds a style is built from, taken apart. Pick a style, switch each step of a sound on and off to hear what it does, and tune it with the knobs."
    >
      {families.map(({ family, styles }) => (
        <section key={family} className="mb-5">
          <h2 className="mt-0 mb-2 text-sm font-semibold tracking-[0.08em] text-muted uppercase">{family}</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
            {styles.map((style) => (
              <Link key={style.id} href={`/styles/${style.id}` as Route} className={cn(boxClass, 'flex flex-col gap-1.5 hover:border-muted')}>
                <span className="flex items-center justify-between gap-2">
                  <b className="text-base">{style.name} →</b>
                  <span className={chip}>{style.tempo} BPM</span>
                </span>
                <span>{style.blurb}</span>
                <span className="flex flex-wrap gap-1.5">
                  <span className={chip}>{style.era}</span>
                  <span className={chip}>{style.key}</span>
                  <span className={chip}>{style.sounds.length} sounds</span>
                </span>
                <span className="text-[13px] text-muted">
                  {GROUPS.filter((g) => style.sounds.some((s) => s.group === g.id))
                    .map((g) => g.label.toLowerCase())
                    .join(' · ')}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </Page>
  );
}
