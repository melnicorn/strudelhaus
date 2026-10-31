import { SandboxClient } from '@/components/sandbox/SandboxClient';
import { Page } from '@/components/ui/Page';

export const metadata = { title: 'Sandbox · Strudel Workshop' };

export default function SandboxPage() {
  return (
    <Page wide title="Sandbox">
      <SandboxClient />
    </Page>
  );
}
