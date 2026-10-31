'use client';

import { Checkbox, Chip, cn, SearchField } from '@heroui/react';
import { useState } from 'react';
import { Hint } from '@/components/ui/Hint';
import { boxClass, linkClass } from '@/components/ui/Page';
import { withTerms } from '@/components/lesson/Prose';
import { findTerm, TERM_CATEGORIES, TERMS, termId, type Term, type TermCategory } from '@/lib/dictionary/terms';

const sorted = [...TERMS].sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base', numeric: true }));
const letterOf = (t: Term) => (/[a-z]/i.test(t.term[0]) ? t.term[0].toUpperCase() : '#');

export function DictionaryView({ referenceNames }: { referenceNames: string[] }) {
  const [query, setQuery] = useState('');
  const [hidden, setHidden] = useState<Set<TermCategory>>(new Set());
  const q = query.trim().toLowerCase();
  const shown = sorted.filter(
    (t) =>
      !hidden.has(t.category) &&
      (!q || t.term.toLowerCase().includes(q) || t.aliases?.some((a) => a.toLowerCase().includes(q)) || t.definition.toLowerCase().includes(q)),
  );
  const letters = [...new Set(shown.map(letterOf))];
  const refs = new Set(referenceNames);

  return (
    <div className="grid grid-cols-[220px_minmax(0,1fr)] items-start gap-3 max-[760px]:grid-cols-1">
      <aside className={cn(boxClass, 'sticky top-3 flex flex-col gap-3 max-[760px]:static')}>
        <SearchField value={query} onChange={setQuery} aria-label="Search the dictionary" className="w-full">
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search words…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <nav className="flex flex-wrap gap-1" aria-label="Jump to letter">
          {letters.map((l) => (
            <a key={l} href={`#letter-${l}`} className="w-6 rounded bg-default text-center text-xs text-foreground hover:bg-accent-soft">
              {l}
            </a>
          ))}
        </nav>
        <fieldset className="m-0 flex flex-col gap-1 border-0 p-0 text-[13px]">
          <legend className="mb-1 text-[11px] tracking-wide text-muted uppercase">Show</legend>
          {TERM_CATEGORIES.map((c) => (
            <Checkbox
              key={c}
              isSelected={!hidden.has(c)}
              onChange={() =>
                setHidden((h) => {
                  const next = new Set(h);
                  if (next.has(c)) next.delete(c);
                  else next.add(c);
                  return next;
                })
              }
            >
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                {c}
              </Checkbox.Content>
            </Checkbox>
          ))}
        </fieldset>
      </aside>

      <dl className={cn(boxClass, 'm-0 py-1.5')}>
        {shown.length === 0 && <Hint className="py-2">No words match “{query}”.</Hint>}
        {shown.map((t, i) => {
          const first = i === 0 || letterOf(shown[i - 1]) !== letterOf(t);
          const code = (t.code ?? []).filter((c) => refs.has(c));
          return (
            <div key={t.term} id={termId(t)} className="scroll-mt-4 border-b border-border py-2 last:border-b-0 target:bg-accent/12">
              {first && (
                <div className="mt-2 mb-1 scroll-mt-4 text-xl font-bold text-muted" id={`letter-${letterOf(t)}`}>
                  {letterOf(t)}
                </div>
              )}
              <dt className="font-semibold">
                {t.term}{' '}
                <Chip size="sm" variant="secondary" className="align-middle font-normal">
                  {t.category}
                </Chip>
              </dt>
              <dd className="mt-0.5">
                {/* The term's own name isn't marked inside its definition. */}
                {withTerms(t.definition, new Set([t]))}
                {t.aliases?.length ? <div className="mt-1 text-[13px] text-muted">Also: {t.aliases.slice(0, 4).join(', ')}</div> : null}
                {(code.length > 0 || t.seeAlso?.length) && (
                  <div className="mt-1 text-[13px] text-muted">
                    {code.length > 0 && (
                      <>
                        In code:{' '}
                        {code.map((c, j) => (
                          <span key={c}>
                            {j > 0 && ', '}
                            <a href={`/reference#${encodeURIComponent(c)}`} className={linkClass}>
                              <code>{c}</code>
                            </a>
                          </span>
                        ))}
                        {t.seeAlso?.length ? ' · ' : ''}
                      </>
                    )}
                    {t.seeAlso?.length ? (
                      <>
                        See also:{' '}
                        {t.seeAlso.map((s, j) => (
                          <span key={s}>
                            {j > 0 && ', '}
                            <a href={`#${termId(findTerm(s) ?? s)}`} className={linkClass}>
                              {s}
                            </a>
                          </span>
                        ))}
                      </>
                    ) : null}
                  </div>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
