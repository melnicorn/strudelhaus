import { ReferenceTable } from '@/components/reference/ReferenceTable';
import { Page } from '@/components/ui/Page';

export const metadata = { title: 'Reference · Strudel Workshop' };

export default function ReferencePage() {
  return (
    <Page
      wide
      title="Reference"
      intro="Every function and notation used in the workshop. Each example plays: click it. Checked against Strudel 1.2.6 / 1.3.0."
    >
      <ReferenceTable />
    </Page>
  );
}
