import { LibraryClient } from '@/components/library/LibraryClient';
import { Page } from '@/components/ui/Page';

export const metadata = { title: 'Library · Strudel Workshop' };

export default function LibraryPage() {
  return (
    <Page
      wide
      title="Library"
      intro="Blocks you’ve saved. Copying one into a project copies its code; if you later save a newer version here, the project shows “update available”."
    >
      <LibraryClient />
    </Page>
  );
}
