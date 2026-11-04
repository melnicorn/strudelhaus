'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

// Lessons read progress from localStorage and run Strudel, so they render in the browser only.
const LessonView = dynamic(() => import('./LessonView').then((m) => m.LessonView), {
  ssr: false,
  loading: () => <p>Loading lesson…</p>,
});

/** The lesson named by the route (core lessons) or by ?id= (lessons from other packs). */
export function LessonClient({ lessonId }: { lessonId?: string }) {
  const params = useSearchParams();
  const id = lessonId ?? params.get('id') ?? '';
  return <LessonView lessonId={id} />;
}
