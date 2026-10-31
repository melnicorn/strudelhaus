import { SoundsClient } from '@/components/sounds/SoundsClient';
import { Page } from '@/components/ui/Page';

export const metadata = { title: 'Sounds · Strudel Workshop' };

export default function SoundsPage() {
  return (
    <Page
      wide
      title="Sounds"
      intro="Click anything to hear it. It plays on top of whatever is already playing, and the bar at the bottom shows the code that makes that sound."
    >
      <SoundsClient />
    </Page>
  );
}
