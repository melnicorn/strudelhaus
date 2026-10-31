'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { lessons } from '@/content/lessons';
import { useProgressStore } from '@/lib/stores/progress';

/** "Start" or "Continue lesson N" depending on saved progress. Styled by the home page's card grid. */
export function ContinueLesson({ className }: { className?: string }) {
  const { progress, loaded, load } = useProgressStore();
  useEffect(load, [load]);
  const next = lessons.find((l) => progress[l.id]?.status !== 'done') ?? lessons[lessons.length - 1];
  const done = lessons.filter((l) => progress[l.id]?.status === 'done').length;
  const started = loaded && done > 0;
  return (
    <Link className={className} href={`/learn/${next.id}`}>
      <b>{started ? `Continue: ${next.number}. ${next.title} →` : 'Start learning →'}</b>
      <span>{started ? `${done} of ${lessons.length} lessons done.` : `${lessons.length} lessons, no music experience needed.`}</span>
    </Link>
  );
}
