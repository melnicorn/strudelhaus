import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import { TermHover } from '@/components/dictionary/TermHover';
import { linkClass } from '@/components/ui/Page';
import { SOURCE_URL } from '@/lib/site';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const THEME_SCRIPT = `(() => {
  const m = matchMedia('(prefers-color-scheme: dark)');
  const set = () => { const d = m.matches; document.documentElement.classList.toggle('dark', d); document.documentElement.classList.toggle('light', !d); };
  set();
  m.addEventListener('change', set);
})()`;

const NAV = [
  ['/learn', 'Learn'],
  ['/sandbox', 'Sandbox'],
  ['/sounds', 'Sounds'],
  ['/library', 'Library'],
  ['/reference', 'Reference'],
  ['/dictionary', 'Dictionary'],
] as const;

export const metadata: Metadata = {
  title: 'Strudel Workshop',
  description: 'Learn to write Strudel code by making 90s house and techno.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Follow the system light/dark setting before first paint (HeroUI themes key off .dark). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <header className="flex flex-wrap items-center gap-5 border-b border-border bg-surface px-4 py-2.5">
          <Link href="/" className="font-bold">
            Strudel Workshop
          </Link>
          <nav className="flex flex-wrap gap-3.5">
            {NAV.map(([href, label]) => (
              <Link key={href} href={href} className="text-muted hover:text-foreground">
                {label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
        <TermHover />
        <footer className="p-4 text-center text-xs text-muted">
          Free software under the{' '}
          <a href="/about" className={linkClass}>
            GNU AGPL-3.0
          </a>{' '}
          ·{' '}
          <a href={SOURCE_URL} className={linkClass}>
            Source code
          </a>{' '}
          · Sound by{' '}
          <a href="https://strudel.cc" className={linkClass}>
            Strudel
          </a>
        </footer>
      </body>
    </html>
  );
}
