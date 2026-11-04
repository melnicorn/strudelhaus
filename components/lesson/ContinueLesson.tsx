'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { allLessons, lessonHref, neighbours, trackOf } from '@/lib/lessons/packs';
import { usePacksStore } from '@/lib/stores/packs';
import { useProgressStore } from '@/lib/stores/progress';

/**
 * "Start" or "Continue …" depending on saved progress: the next lesson in the track you touched
 * last, else the first unfinished core lesson. Styled by the home page's card grid.
 */
export function ContinueLesson({ className }: { className?: string }) {
  const { progress, loaded, load } = useProgressStore();
  useEffect(load, [load]);
  const loadPacks = usePacksStore((s) => s.load);
  useEffect(() => void loadPacks(), [loadPacks]);
  usePacksStore((s) => s.packs);
  const lessons = allLessons();
  const done = lessons.filter((l) => progress[l.id]?.status === 'done').length;
  const started = loaded && Object.keys(progress).length > 0;

  // The lesson touched most recently; if it's done, the one after it in its track.
  const latest = lessons
    .filter((l) => progress[l.id])
    .sort((a, b) => (progress[b.id]!.updatedAt > progress[a.id]!.updatedAt ? 1 : -1))[0];
  const next = (latest && progress[latest.id]?.status !== 'done' ? latest : latest && neighbours(latest).next) ?? lessons.find((l) => progress[l.id]?.status !== 'done') ?? lessons[0];
  return (
    <Link className={className} href={lessonHref(next)}>
      <b>{started ? `Continue: ${trackOf(next).title} · ${next.number}. ${next.title} →` : 'Start learning →'}</b>
      <span>{started ? `${done} of ${lessons.length} lessons done.` : `${lessons.length} lessons, no music experience needed.`}</span>
    </Link>
  );
}
