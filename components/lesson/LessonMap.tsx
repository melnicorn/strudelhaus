'use client';

import { cn } from '@heroui/react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Hint } from '@/components/ui/Hint';
import { boxClass } from '@/components/ui/Page';
import { Panel } from '@/components/ui/Panel';
import { lessons } from '@/content/lessons';
import type { Tier } from '@/lib/lessons/types';
import { useProgressStore } from '@/lib/stores/progress';
import { MoveProgress } from './MoveProgress';

const TIERS: { tier: Tier; title: string; blurb: string }[] = [
  { tier: 'beginner', title: 'Beginner · First groove', blurb: 'Drums, tempo, steps and a first bassline.' },
  { tier: 'intermediate', title: 'Intermediate · Sound and harmony', blurb: 'Swing, scales, chords, synths, effects and modifiers.' },
  { tier: 'expert', title: 'Expert · The track', blurb: 'Acid lines, sidechain, arrangement and the capstone.' },
];

export function LessonMap() {
  const { progress, load } = useProgressStore();
  useEffect(load, [load]);
  return (
    <div className="flex flex-col gap-3">
      {TIERS.map(({ tier, title, blurb }) => {
        const list = lessons.filter((l) => l.tier === tier);
        const done = list.filter((l) => progress[l.id]?.status === 'done').length;
        return (
          <Panel
            key={tier}
            title={
              <>
                {title} · {done}/{list.length}
              </>
            }
          >
            <Hint>{blurb}</Hint>
            {list.length === 0 ? (
              <Hint>Coming soon.</Hint>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
                {list.map((l) => {
                  const status = progress[l.id]?.status ?? 'new';
                  return (
                    <Link
                      key={l.id}
                      href={`/learn/${l.id}`}
                      className={cn(
                        boxClass,
                        'p-2.5 hover:bg-surface-secondary',
                        status === 'done' && 'border-success',
                        status === 'started' && 'border-accent',
                      )}
                    >
                      <span className="font-mono text-[13px]">{status === 'done' ? '✓' : status === 'started' ? '▶' : l.number}</span> {l.title}
                    </Link>
                  );
                })}
              </div>
            )}
          </Panel>
        );
      })}
      <MoveProgress />
    </div>
  );
}
