'use client';

import { Button, Chip, cn, SearchField } from '@heroui/react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Hint } from '@/components/ui/Hint';
import { boxClass, linkClass } from '@/components/ui/Page';
import { Panel } from '@/components/ui/Panel';
import { allTags, knownSkills, lessonHref, lessonState, missingSkills, searchLessons, type LessonState } from '@/lib/lessons/packs';
import type { Lesson, Pack, Track } from '@/lib/lessons/types';
import { usePacksStore } from '@/lib/stores/packs';
import { useProgressStore } from '@/lib/stores/progress';
import { MoveProgress } from './MoveProgress';
import { PackImport } from './PackImport';

/**
 * The skill tree: every pack's tracks as lanes of lessons. Nothing is locked; a track whose
 * skills you don't have yet says what it builds on, and the next lesson of each open track is marked.
 */
export function LessonMap() {
  const { progress, load } = useProgressStore();
  useEffect(load, [load]);
  const packs = usePacksStore((s) => s.packs);
  const loadPacks = usePacksStore((s) => s.load);
  useEffect(() => void loadPacks(), [loadPacks]);
  const [query, setQuery] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const collapsed = usePacksStore((s) => s.collapsed);
  const toggleCollapsed = usePacksStore((s) => s.toggleCollapsed);

  const known = useMemo(() => knownSkills(progress), [progress, packs]); // eslint-disable-line react-hooks/exhaustive-deps
  const filtering = !!query.trim() || tags.length > 0;
  const matches = useMemo(() => new Set(searchLessons(query, tags).map((l) => l.id)), [query, tags, packs]); // eslint-disable-line react-hooks/exhaustive-deps
  const tagList = useMemo(() => allTags(), [packs]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggleTag = (t: string) => setTags((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]));

  return (
    <div className="flex flex-col gap-3">
      <Panel className="flex-row flex-wrap items-center gap-2">
        <SearchField value={query} onChange={setQuery} aria-label="Search lessons" className="w-full sm:w-64">
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search lessons…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <div className="flex flex-wrap gap-1">
          {tagList.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTag(t)}
              aria-pressed={tags.includes(t)}
              className={cn('rounded-full border px-2 py-0.5 text-xs', tags.includes(t) ? 'border-accent bg-accent/15 text-foreground' : 'border-border text-muted hover:text-foreground')}
            >
              {t}
            </button>
          ))}
        </div>
        {filtering && (
          <Button
            size="sm"
            variant="ghost"
            onPress={() => {
              setQuery('');
              setTags([]);
            }}
          >
            Clear · {matches.size} match{matches.size === 1 ? '' : 'es'}
          </Button>
        )}
      </Panel>

      {packs.map((pack) => (
        <PackLanes
          key={pack.id}
          pack={pack}
          known={known}
          progress={progress}
          filter={filtering ? matches : null}
          collapsed={collapsed.has(pack.id)}
          onToggle={() => toggleCollapsed(pack.id)}
        />
      ))}

      <PackImport />
      <MoveProgress />
    </div>
  );
}

interface LanesProps {
  pack: Pack;
  known: Set<string>;
  progress: ReturnType<typeof useProgressStore.getState>['progress'];
  filter: Set<string> | null;
}

function PackLanes({ pack, known, progress, filter, collapsed, onToggle }: LanesProps & { collapsed: boolean; onToggle(): void }) {
  const removePack = usePacksStore((s) => s.removePack);
  const source = usePacksStore((s) => s.sources[pack.id]);
  const tracks = pack.tracks.filter((t) => !filter || t.lessons.some((l) => filter.has(l.id)));
  if (!tracks.length) return null;
  const all = pack.lessons.length;
  const done = pack.lessons.filter((l) => progress[l.id]?.status === 'done').length;
  // A search always shows what it found, folded or not.
  const open = !collapsed || !!filter;
  return (
    <Panel
      title={
        <button type="button" className="flex items-center gap-1.5 text-left uppercase hover:text-foreground" onClick={onToggle} aria-expanded={open}>
          <span aria-hidden className="inline-block w-3 text-[10px]">
            {open ? '▼' : '▶'}
          </span>
          {pack.title} · {done}/{all}
        </button>
      }
      actions={
        pack.source === 'imported' ? (
          <Button size="sm" variant="ghost" onPress={() => confirm(`Remove the pack “${pack.title}” from this browser? Your progress in it is kept.`) && removePack(pack.id)}>
            Remove pack
          </Button>
        ) : undefined
      }
    >
      {!open && <Hint>{pack.description}</Hint>}
      {open && pack.id !== 'core' && (
        <Hint>
          {pack.description}
          {pack.author && ` · by ${pack.author}`}
          {source && (
            <>
              {' · '}
              <a href={source} className={linkClass}>
                source
              </a>
            </>
          )}
        </Hint>
      )}
      {open && tracks.map((track) => <Lane key={track.id} track={track} known={known} progress={progress} filter={filter} />)}
    </Panel>
  );
}

function Lane({ track, known, progress, filter }: { track: Track } & Omit<LanesProps, 'pack'>) {
  const missing = missingSkills(track, known);
  const lessons = filter ? track.lessons.filter((l) => filter.has(l.id)) : track.lessons;
  const done = track.lessons.filter((l) => progress[l.id]?.status === 'done').length;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <strong className="text-sm">{track.title}</strong>
        <Hint>
          {done}/{track.lessons.length} · {track.blurb}
        </Hint>
        {track.kind === 'line' && (
          <Chip size="sm" variant="soft" color="accent">
            Track line: each lesson builds on the last
          </Chip>
        )}
        {missing.length > 0 && (
          <Chip size="sm" variant="soft" color="warning" title={missing.map((s) => `${s.id}: ${s.definition}`).join('\n')}>
            builds on {missing.map((s) => s.name).join(', ')}
          </Chip>
        )}
      </div>
      <ol className="m-0 flex list-none flex-wrap items-stretch gap-y-2 p-0">
        {lessons.map((l, i) => (
          <li key={l.id} className="flex items-center">
            {i > 0 && <span aria-hidden className={cn('mx-1 text-xs', track.kind === 'line' ? 'text-accent' : 'text-border')}>{track.kind === 'line' ? '━▶' : '─'}</span>}
            <LessonNode lesson={l} state={lessonState(l, progress, known)} />
          </li>
        ))}
      </ol>
    </div>
  );
}

const NODE: Record<LessonState, string> = {
  done: 'border-success',
  started: 'border-accent',
  next: 'border-accent bg-accent/10',
  open: '',
};

function LessonNode({ lesson, state }: { lesson: Lesson; state: LessonState }) {
  const mark = state === 'done' ? '✓' : state === 'started' ? '▶' : lesson.number;
  return (
    <Link href={lessonHref(lesson)} className={cn(boxClass, 'flex min-w-[150px] max-w-[220px] flex-col gap-0.5 p-2 text-sm no-underline hover:bg-surface-secondary', NODE[state])} title={lesson.goal}>
      <span>
        <span className="font-mono text-[12px] text-muted">{mark}</span> {lesson.title}
      </span>
      <span className="flex flex-wrap gap-1 text-[10px] text-muted">
        {state === 'next' && <span className="text-accent">next up</span>}
        {lesson.shape && lesson.shape !== 'concept' && <span>{lesson.shape}</span>}
        {lesson.tags.slice(0, 3).map((t) => (
          <span key={t}>#{t}</span>
        ))}
      </span>
    </Link>
  );
}
