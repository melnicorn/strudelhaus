'use client';

import dynamic from 'next/dynamic';

// The author page keeps its draft in localStorage and runs Strudel to validate, so it renders in the browser only.
const AuthorView = dynamic(() => import('./AuthorView').then((m) => m.AuthorView), {
  ssr: false,
  loading: () => <p>Loading…</p>,
});

export function AuthorClient() {
  return <AuthorView />;
}
