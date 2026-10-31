'use client';

import dynamic from 'next/dynamic';

// Projects live in localStorage, so the sandbox renders in the browser only.
const SandboxView = dynamic(() => import('./SandboxView').then((m) => m.SandboxView), {
  ssr: false,
  loading: () => <p>Loading…</p>,
});

export function SandboxClient() {
  return <SandboxView />;
}
