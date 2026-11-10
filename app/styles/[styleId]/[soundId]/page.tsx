import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { StyleView } from '@/components/styles/StyleView';
import { Page } from '@/components/ui/Page';
import { getStyle, styles } from '@/lib/styles/load';

// One page per sound of every style: both parts of the path are ids from the config.
export function generateStaticParams() {
  return styles.flatMap((style) => style.sounds.map((sound) => ({ styleId: style.id, soundId: sound.id })));
}

export async function generateMetadata({ params }: PageProps<'/styles/[styleId]/[soundId]'>) {
  const { styleId, soundId } = await params;
  const style = getStyle(styleId);
  const sound = style?.sounds.find((s) => s.id === soundId);
  return { title: `${sound ? `${sound.name} · ${style!.name}` : 'Style'} · Strudel Workshop` };
}

async function Sound({ params }: { params: PageProps<'/styles/[styleId]/[soundId]'>['params'] }) {
  const { styleId, soundId } = await params;
  const style = getStyle(styleId);
  if (!style || !style.sounds.some((s) => s.id === soundId)) notFound();
  return <StyleView style={style} soundId={soundId} />;
}

export default function SoundPage({ params }: PageProps<'/styles/[styleId]/[soundId]'>) {
  return (
    <Page wide>
      <Suspense fallback={<p className="text-muted">Loading sound…</p>}>
        <Sound params={params} />
      </Suspense>
    </Page>
  );
}
