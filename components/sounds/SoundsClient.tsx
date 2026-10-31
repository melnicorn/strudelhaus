'use client';

import dynamic from 'next/dynamic';

// Plays audio and reads the sandbox project from localStorage, so it renders in the browser only.
const SoundsView = dynamic(() => import('./SoundsView').then((m) => m.SoundsView), { ssr: false, loading: () => <p className="text-muted">Loading…</p> });

export function SoundsClient() {
  return <SoundsView />;
}
