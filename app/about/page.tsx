import { linkClass, Page } from '@/components/ui/Page';
import { SOURCE_URL } from '@/lib/site';

export const metadata = { title: 'About · Strudel Workshop' };

const h2Class = 'mt-6 mb-2 text-lg font-semibold';

export default function AboutPage() {
  return (
    <Page
      title="About"
      intro={
        <>
          Strudel Workshop teaches live-coding music with{' '}
          <a href="https://strudel.cc" className={linkClass}>
            Strudel
          </a>
          , through 90s house and techno.
        </>
      }
    >
      <div className="flex max-w-3xl flex-col gap-3">
        <h2 className={h2Class}>License</h2>
        <p>
          This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as
          published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. It uses the
          Strudel packages (<code>@strudel/*</code>, <code>superdough</code>), which are licensed AGPL-3.0-or-later.
        </p>
        <p>
          The full license text is in the <code>LICENSE</code> file. The source code of this site is available here:{' '}
          <a href={SOURCE_URL} className={`${linkClass} break-all`}>
            {SOURCE_URL}
          </a>
          .
        </p>
        <h2 className={h2Class}>Credits</h2>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>
            Strudel by Felix Roos, Alex McLean and contributors (
            <a href="https://codeberg.org/uzu/strudel" className={linkClass}>
              codeberg.org/uzu/strudel
            </a>
            ).
          </li>
          <li>Drum machine samples from the tidal-drum-machines collection, served by the Strudel CDN.</li>
        </ul>
      </div>
    </Page>
  );
}
