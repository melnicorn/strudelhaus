import { Suspense } from 'react';
import { LessonClient } from '@/components/lesson/LessonClient';
import { Page } from '@/components/ui/Page';

export const metadata = { title: 'Lesson · Strudel Workshop' };

/** Lessons from extra and imported packs: /lesson/?id=pack/lesson. Not under /learn, where the [lessonId] route would catch it; the static export can’t prerender unknown ids.. */
export default function PackLessonPage() {
  return (
    <Page wide>
      <Suspense fallback={<p className="text-muted">Loading lesson…</p>}>
        <LessonClient />
      </Suspense>
    </Page>
  );
}
