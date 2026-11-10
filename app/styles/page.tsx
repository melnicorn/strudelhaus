import type { Route } from 'next';
import Link from 'next/link';
import { cn } from '@heroui/react';
import { boxClass, Page } from '@/components/ui/Page';
import { styles } from '@/lib/styles/load';

export const metadata = { title: 'Styles · Strudel Workshop' };

const chip = 'rounded-full border border-border bg-surface-secondary px-2 py-px text-[11px] whitespace-nowrap';

export default function StylesPage() {
  return (
    <Page
      title="Styles"
      intro="The sounds a style is built from, taken apart. Pick a style, switch each step of a sound on and off to hear what it does, and tune it with the knobs."
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
        {styles.map((style) => (
          <Link key={style.id} href={`/styles/${style.id}` as Route} className={cn(boxClass, 'flex flex-col gap-1.5 hover:border-muted')}>
            <span className="flex items-center justify-between gap-2">
              <b className="text-base">{style.name} →</b>
              <span className={chip}>{style.era}</span>
            </span>
            <span>{style.blurb}</span>
            <span className="flex flex-wrap gap-1.5">
              <span className={chip}>{style.tempo} BPM</span>
              <span className={chip}>{style.key}</span>
            </span>
            <span className="text-[13px] text-muted">{style.sounds.map((s) => s.name).join(' · ')}</span>
          </Link>
        ))}
      </div>
    </Page>
  );
}
