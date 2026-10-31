'use client';

import dynamic from 'next/dynamic';

// Lessons read progress from localStorage and run Strudel, so they render in the browser only.
const LessonView = dynamic(() => import('./LessonView').then((m) => m.LessonView), {
  ssr: false,
  loading: () => <p>Loading lesson…</p>,
});

export function LessonClient({ lessonId }: { lessonId: string }) {
  return <LessonView lessonId={lessonId} />;
}
