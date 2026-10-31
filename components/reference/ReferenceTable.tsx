'use client';

import { Button, Checkbox, Chip, SearchField } from '@heroui/react';
import { useEffect, useState } from 'react';
import { Hint } from '@/components/ui/Hint';
import { linkClass } from '@/components/ui/Page';
import { Panel } from '@/components/ui/Panel';
import { SimpleSelect } from '@/components/ui/SimpleSelect';
import { TipButton } from '@/components/ui/TipButton';
import { getEngine } from '@/lib/audio/engine';
import { CATEGORIES, REFERENCE, learnedIn, type Category } from '@/lib/reference/entries';
import { useProgressStore } from '@/lib/stores/progress';
import { lessons } from '@/content/lessons';

async function tryIt(example: string) {
  const engine = await getEngine();
  await engine.unlock();
  const code = /setcpm/.test(example) ? example : `setcpm(124/4)\n${example}`;
  await engine.evaluate(code);
}

export function ReferenceTable() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [learnedOnly, setLearnedOnly] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const { progress, load } = useProgressStore();
  useEffect(load, [load]);
  const doneNumbers = new Set(lessons.filter((l) => progress[l.id]?.status === 'done').map((l) => l.number));

  const q = query.trim().toLowerCase();
  const rows = REFERENCE.filter(
    (e) =>
      (category === 'all' || e.category === category) &&
      (!q || [e.name, e.display, e.aliases ?? '', e.does].some((t) => t.toLowerCase().includes(q))) &&
      (!learnedOnly || doneNumbers.has(learnedIn(e) ?? -1)),
  );

  return (
    <div className="flex flex-col gap-3">
      <Panel className="flex-row flex-wrap items-center gap-3">
        <SearchField value={query} onChange={setQuery} aria-label="Search the reference" className="w-full sm:w-64">
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search functions…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <SimpleSelect
          value={category}
          onChange={(v) => setCategory(v as Category | 'all')}
          options={[{ value: 'all', label: 'all categories' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
          aria-label="Category"
        />
        <Checkbox isSelected={learnedOnly} onChange={setLearnedOnly}>
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            only what I&apos;ve learned
          </Checkbox.Content>
        </Checkbox>
        {playing && (
          <Button
            size="sm"
            variant="secondary"
            onPress={async () => {
              (await getEngine()).stop();
              setPlaying(null);
            }}
          >
            ■ Stop
          </Button>
        )}
        <span className="ml-auto text-xs text-muted">
          {rows.length} of {REFERENCE.length}
        </span>
      </Panel>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px] [&_td]:border-b [&_td]:border-border [&_td]:px-2 [&_td]:py-1.5 [&_td]:align-top [&_th]:border-b [&_th]:border-border [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:align-top [&_th]:font-semibold">
          <thead>
            <tr>
              <th>Function</th>
              <th>Takes</th>
              <th>What it does</th>
              <th>Try it</th>
              <th>Lesson</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const lesson = learnedIn(e);
              const l = lessons.find((x) => x.number === lesson);
              return (
                <tr key={e.name} id={encodeURIComponent(e.name)} className="scroll-mt-4 target:bg-accent/12">
                  <td>
                    <code>{e.display}</code>
                    {e.aliases && <Hint>also: {e.aliases}</Hint>}
                  </td>
                  <td className="text-xs text-muted">{e.takes}</td>
                  <td>
                    {e.does}
                    {e.caveat && (
                      <div className="mt-1">
                        <Chip size="sm" variant="soft" color={e.caveat === 'Missing feature' ? 'danger' : 'warning'}>
                          {e.caveat}
                        </Chip>
                      </div>
                    )}
                  </td>
                  <td>
                    <TipButton
                      size="sm"
                      variant="secondary"
                      tip="Play this example"
                      className="h-auto min-h-7 max-w-[360px] justify-start py-1 text-left font-mono text-xs whitespace-normal"
                      onPress={async () => {
                        setPlaying(e.name);
                        await tryIt(e.example);
                      }}
                    >
                      ▶ {e.example}
                    </TipButton>
                  </td>
                  <td>
                    {l ? (
                      <a href={`/learn/${l.id}`} className={linkClass}>
                        L{l.number}
                      </a>
                    ) : (
                      ''
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
