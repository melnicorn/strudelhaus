import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { corePack, getLesson } from '@/lib/lessons/packs';
import { LessonClient } from '@/components/lesson/LessonClient';
import { Page } from '@/components/ui/Page';

export function generateStaticParams() {
  return corePack.lessons.map((l) => ({ lessonId: l.id }));
}

export async function generateMetadata({ params }: PageProps<'/learn/[lessonId]'>) {
  const lesson = getLesson((await params).lessonId);
  return { title: lesson ? `${lesson.number}. ${lesson.title} · Strudel Workshop` : 'Lesson · Strudel Workshop' };
}

async function Lesson({ params }: { params: PageProps<'/learn/[lessonId]'>['params'] }) {
  const { lessonId } = await params;
  if (!getLesson(lessonId)) notFound();
  return <LessonClient lessonId={lessonId} />;
}

export default function LessonPage({ params }: PageProps<'/learn/[lessonId]'>) {
  return (
    <Page wide>
      <Suspense fallback={<p className="text-muted">Loading lesson…</p>}>
        <Lesson params={params} />
      </Suspense>
    </Page>
  );
}
