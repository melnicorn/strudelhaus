import { LessonMap } from '@/components/lesson/LessonMap';
import { Page } from '@/components/ui/Page';

export const metadata = { title: 'Learn · Strudel Workshop' };

export default function LearnPage() {
  return (
    <Page
      title="Learn"
      intro="Thirty-three lessons from a first kick drum to an arranged 90s acid house track. Every lesson stays open: skip ahead whenever you like."
    >
      <LessonMap />
    </Page>
  );
}
