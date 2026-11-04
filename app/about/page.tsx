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
        <h2 className={h2Class} id="packs">
          Lesson packs
        </h2>
        <p>
          Lessons are data: a <b>pack</b> is one JSON file with tracks of lessons, and the site’s own curriculum is such a pack. Anyone can write
          one on the{' '}
          <a href="/author" className={linkClass}>
            Lesson author
          </a>{' '}
          page, validate it there, and share the file; a learner adds it from the Learn page. A pack’s starter and solution code runs in the
          browser like anything pasted into the Sandbox, so add packs from people you trust. Checks never run as code: they are expressions in
          a small language over what the code <i>plays</i>, so any way of writing the same music passes.
        </p>
        <p className="font-mono text-xs whitespace-pre-wrap">
          {`{ "playsAt": { "s": "bd", "at": [0, 0.25, 0.5, 0.75] } }        exactly these onsets, every bar
{ "includesTimes": { "s": "oh", "at": [0.125, 0.375] } }      at least these onsets
{ "every": { "sel": { "s": "cp" }, "where": [{ "key": "room", "gt": 0, "default": 0 }] } }
{ "some": { "sel": { "note": true }, "where": [{ "key": "$midi", "lt": 40 }] } }
{ "all": [ … ] }  { "any": [ … ] }  { "not": … }
{ "uses": "lpf" }  { "matches": "regex" }  { "defines": "hats" }  { "final": "arrange" }
{ "block": { "name": "drums", "kind": ["group", "section"], "members": ["kick", "clap"] } }
{ "inKey": { "key": "C:minor" } }      (or the code's const key when key is left out)
{ "gte": [ { "count": { "s": "hh", "bar": 3 } }, 8 ] }      eq neq gt gte lt lte over values
values: { "count": sel } { "distinct": { sel, key, round, bars } } { "values": { sel, key, unique, sorted } }
        { "valueAt": { sel, key, index, default } } { "max" | "min": { sel, key, default } } { "timeAt": { sel, index } }
        { "bpm": true } { "key": true } { "maxChordSize": true } { "lowestPitchClass": { bar } }
        { "rows": true } { "rowBars": n } { "rowStart": n } { "maxCount": { sel, bars } } { "plus" | "minus" | "mul": [a, b] }
sel:    { "s": "bd" | ["cp", "oh"], "note": true, "bar": 2, "cycles": 2, "at": 0.25, "where": [cond] }
cond:   { "key": "gain", "gte": .5, "lt": 1, "eq", "neq", "in": [...], "defined": true, "default": .8 }
        keys are Strudel controls, or $midi, $pc (pitch class), $note, $time (onset in the bar)`}
        </p>
        <p>
          The validator (<code>npm run lessons:validate pack.json</code>, or the author page) walks every lesson the way a learner would: the
          starter passes no task, the code after each step passes exactly the tasks done so far, the solution passes them all, and the challenge
          passes only in <code>challengeSolution</code>. In a track line each lesson’s starter is the previous solution, and no solution undoes an
          earlier task.
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
