import { LessonMap } from '@/components/lesson/LessonMap';
import { Page } from '@/components/ui/Page';

export const metadata = { title: 'Learn · Strudel Workshop' };

export default function LearnPage() {
  return (
    <Page
      title="Learn"
      intro="From a first kick drum to an arranged track, by skill rather than by number. Every lesson stays open: skip ahead whenever you like, and search by what you want to make."
    >
      <LessonMap />
    </Page>
  );
}
