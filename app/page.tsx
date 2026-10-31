import Link from 'next/link';
import type { Route } from 'next';
import { cn } from '@heroui/react';
import { ContinueLesson } from '@/components/lesson/ContinueLesson';
import { boxClass, linkClass, Page } from '@/components/ui/Page';

const homeCardClass = cn(boxClass, 'flex flex-col gap-1.5 hover:border-muted');

function HomeCard({ href, title, children }: { href: Route; title: string; children: string }) {
  return (
    <Link className={homeCardClass} href={href}>
      <b>{title}</b>
      <span>{children}</span>
    </Link>
  );
}

export default function Home() {
  return (
    <Page
      title="Strudel Workshop"
      lede
      intro={
        <>
          Learn to write{' '}
          <a href="https://strudel.cc" className={linkClass}>
            Strudel
          </a>{' '}
          code by making 90s house and techno, from a first kick drum to an arranged acid house track. The controls are training wheels: every
          click writes real code you can read and change.
        </>
      }
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
        <ContinueLesson className={cn(homeCardClass, 'border-success bg-success/15 hover:border-success')} />
        <HomeCard href="/sandbox" title="Sandbox →">
          Free play with every control: parts, groups, modifiers and the arrangement.
        </HomeCard>
        <HomeCard href="/library" title="Library →">
          The blocks you’ve saved, ready to combine.
        </HomeCard>
        <HomeCard href="/reference" title="Reference →">
          Every function, with an example you can play.
        </HomeCard>
      </div>
    </Page>
  );
}
