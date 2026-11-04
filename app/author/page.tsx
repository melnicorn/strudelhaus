import { AuthorClient } from '@/components/author/AuthorClient';
import { Page } from '@/components/ui/Page';

export const metadata = { title: 'Lesson author · Strudel Workshop' };

export default function AuthorPage() {
  return (
    <Page wide title="Lesson author">
      <AuthorClient />
    </Page>
  );
}
