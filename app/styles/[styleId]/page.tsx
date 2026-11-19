import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { StyleView } from '@/components/styles/StyleView';
import { Page } from '@/components/ui/Page';
import { getStyle, styles } from '@/lib/styles/load';

// One page per file in content/styles/: the path is the style's `id`.
export function generateStaticParams() {
  return styles.map((s) => ({ styleId: s.id }));
}

export async function generateMetadata({ params }: PageProps<'/styles/[styleId]'>) {
  const style = getStyle((await params).styleId);
  return { title: `${style?.name ?? 'Style'} · Strudel Workshop` };
}

async function Style({ params }: { params: PageProps<'/styles/[styleId]'>['params'] }) {
  const style = getStyle((await params).styleId);
  if (!style) notFound();
  return <StyleView style={style} soundId={style.sounds[0].id} />;
}

export default function StylePage({ params }: PageProps<'/styles/[styleId]'>) {
  return (
    <Page wide>
      <Suspense fallback={<p className="text-muted">Loading style…</p>}>
        <Style params={params} />
      </Suspense>
    </Page>
  );
}
