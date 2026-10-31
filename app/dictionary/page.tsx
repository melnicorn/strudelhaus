import { Kbd } from '@heroui/react';
import { DictionaryView } from '@/components/dictionary/DictionaryView';
import { Page } from '@/components/ui/Page';
import { REFERENCE } from '@/lib/reference/entries';

export const metadata = { title: 'Dictionary · Strudel Workshop' };

export default function DictionaryPage() {
  return (
    <Page
      wide
      title="Dictionary"
      intro={
        <>
          Music and production words used in the lessons, in plain language. Anywhere on the site, hold <Kbd>⌘</Kbd> (or <Kbd>Ctrl</Kbd>) and
          dictionary words get a dotted underline: hover one to see what it means, ⌘-click to jump here.
        </>
      }
    >
      <DictionaryView referenceNames={REFERENCE.map((r) => r.name)} />
    </Page>
  );
}
