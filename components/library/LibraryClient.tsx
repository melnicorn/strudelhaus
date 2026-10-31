'use client';

import dynamic from 'next/dynamic';

// The library lives in localStorage, so it renders in the browser only.
const LibraryView = dynamic(() => import('./LibraryView').then((m) => m.LibraryView), { ssr: false, loading: () => <p className="text-muted">Loading…</p> });

export function LibraryClient() {
  return <LibraryView />;
}
