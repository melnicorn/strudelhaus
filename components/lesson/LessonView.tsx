'use client';

import { Button, Chip, cn, Tabs } from '@heroui/react';
import { TipButton } from '@/components/ui/TipButton';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { allowedMethods, getLesson, neighbours } from '@/content/lessons';
import { BlockPanels } from '@/components/blocks/BlockPanels';
import { GuiPolicyProvider } from '@/components/blocks/policy';
import { Hint } from '@/components/ui/Hint';
import { linkClass } from '@/components/ui/Page';
import { Panel } from '@/components/ui/Panel';
import { Workbench } from '@/components/workbench/Workbench';
import { getEngine } from '@/lib/audio/engine';
import { buildContext } from '@/lib/lessons/checks';
import type { Lesson } from '@/lib/lessons/types';
import { itemFromBlock, loadLibrary, saveLibrary, upsertItem } from '@/lib/storage/library';
import { useEditorStore } from '@/lib/stores/editor';
import { useProgressStore } from '@/lib/stores/progress';
import { parseProject } from '@/lib/sync/parseProject';
import { isMac } from '@/lib/platform';
import { Prose, inline } from './Prose';

const TIER_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', expert: 'Expert' } as const;

export function LessonView({ lessonId }: { lessonId: string }) {
  const lesson = getLesson(lessonId)!;
  const { progress, load, update, reset } = useProgressStore();
  useEffect(load, [load]);
  const loaded = useProgressStore((s) => s.loaded);
  const saved = progress[lessonId];
  const [resetKey, setResetKey] = useState(0);

  if (!loaded) return <p className="p-4">Loading…</p>;
  const initialCode = saved?.lastCode ?? lesson.starter;
  return (
    <LessonBody
      key={`${lessonId}:${resetKey}`}
      lesson={lesson}
      initialCode={initialCode}
      passed={saved?.tasksPassed ?? []}
      challengePassed={!!saved?.challengePassed}
      done={saved?.status === 'done'}
      onProgress={(u) => update(lessonId, u)}
      onReset={() => {
        reset(lessonId);
        setResetKey((k) => k + 1);
      }}
    />
  );
}

interface BodyProps {
  lesson: Lesson;
  initialCode: string;
  passed: number[];
  challengePassed: boolean;
  done: boolean;
  onProgress(u: Parameters<ReturnType<typeof useProgressStore.getState>['update']>[1]): void;
  onReset(): void;
}

function LessonBody({ lesson, initialCode, passed, challengePassed, done, onProgress, onReset }: BodyProps) {
  const { prev, next } = neighbours(lesson.id);
  const policy = useMemo(() => ({ methods: allowedMethods(lesson.id), composition: !!lesson.composition }), [lesson]);
  const [showHint, setShowHint] = useState<number | 'challenge' | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'lesson' | 'code'>('lesson');
  const allPassed = lesson.tasks.every((_, i) => passed.includes(i));
  const progressRef = useRef(onProgress);
  useEffect(() => {
    progressRef.current = onProgress;
  });

  // Run the checks against the current code (no audio needed).
  const runChecks = useCallback(
    async (code: string) => {
      const r = await buildContext(code);
      if ('error' in r) {
        setCheckError(r.error);
        return;
      }
      setCheckError(null);
      const nowPassing = lesson.tasks.map((t, i) => (safe(() => t.check(r.ctx)) ? i : -1)).filter((i) => i >= 0);
      const challenge = !!lesson.challenge && safe(() => lesson.challenge!.check(r.ctx));
      const total = new Set([...passed, ...nowPassing]);
      progressRef.current({
        status: lesson.tasks.every((_, i) => total.has(i)) ? 'done' : 'started',
        tasksPassed: nowPassing,
        ...(challenge ? { challengePassed: true } : {}),
      });
    },
    [lesson, passed],
  );

  // Check (and save the code) shortly after each edit; tasks tick as soon as the code is right.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let last = '';
    return useEditorStore.subscribe(({ code }) => {
      if (!code || code === last) return;
      last = code;
      clearTimeout(timer);
      timer = setTimeout(() => {
        progressRef.current({ lastCode: code });
        void runChecks(code);
      }, 500);
    });
  }, [runChecks]);

  useEffect(() => {
    if (!lesson.preload?.length) return;
    getEngine().then((e) => e.preload(lesson.preload!));
  }, [lesson]);

  const saveParts = () => {
    const code = useEditorStore.getState().code;
    const model = parseProject(code);
    let items = loadLibrary();
    let count = 0;
    for (const b of model.blocks) {
      if (b.kind !== 'part') continue;
      const item = itemFromBlock(code, b.name, { source: { lessonId: lesson.id }, tags: [lesson.title] });
      if (item) {
        items = upsertItem(items, item);
        count++;
      }
    }
    setSaveNote(saveLibrary(items) ? `Saved ${count} part${count === 1 ? '' : 's'} to your library.` : 'Saving failed (browser storage unavailable).');
  };

  return (
    <div className="grid grid-cols-[minmax(280px,380px)_minmax(0,1fr)] items-start gap-4 max-[1100px]:grid-cols-[minmax(0,1fr)]">
      <Tabs
        variant="secondary"
        selectedKey={mobileTab}
        onSelectionChange={(k) => setMobileTab(k as 'lesson' | 'code')}
        className="sticky top-0 z-[3] w-full bg-background min-[1101px]:hidden"
      >
        <Tabs.ListContainer>
          <Tabs.List aria-label="Lesson or code" className="w-full">
            <Tabs.Tab id="lesson" className="flex-1">
              Lesson
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="code" className="flex-1">
              Code &amp; controls
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      <aside className={cn('flex min-w-0 flex-col gap-3', mobileTab === 'code' && 'max-[1100px]:hidden')}>
        <nav className="flex flex-wrap items-center gap-3">
          <Link href="/learn" className={linkClass}>
            ◀ Learn
          </Link>
          <Chip size="sm">{TIER_LABEL[lesson.tier]}</Chip>
          <Hint>Lesson {lesson.number}</Hint>
        </nav>
        <h1 className="m-0 text-[22px] leading-tight font-bold">{lesson.title}</h1>
        <Panel title="Goal">
          <p className="m-0 font-semibold">{lesson.goal}</p>
        </Panel>
        <Panel title="Concept" actions={<Hint>hold {isMac() ? '⌘' : 'Ctrl'} to look up words</Hint>}>
          <Prose text={lesson.concept} />
        </Panel>
        <Panel title="Task">
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {lesson.tasks.map((t, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden>{passed.includes(i) ? '☑' : '☐'}</span>
                <span className={cn('min-w-0', passed.includes(i) && 'text-muted')}>
                  {inline(t.text)}{' '}
                  {passed.includes(i) && (
                    <Chip size="sm" color="success" className="align-middle">
                      passed
                    </Chip>
                  )}
                  <Button size="sm" variant="ghost" className={inlineBtn} onPress={() => setShowHint(showHint === i ? null : i)}>
                    hint
                  </Button>
                  {showHint === i && <HintBox>{inline(t.hint)}</HintBox>}
                </span>
              </li>
            ))}
          </ol>
          {lesson.challenge && (
            <div className={cn('mt-1', challengePassed && 'text-muted')}>
              ✦ <i>Challenge:</i> {inline(lesson.challenge.text)}{' '}
              {challengePassed && (
                <Chip size="sm" color="success" className="align-middle">
                  passed
                </Chip>
              )}
              <Button size="sm" variant="ghost" className={inlineBtn} onPress={() => setShowHint(showHint === 'challenge' ? null : 'challenge')}>
                hint
              </Button>
              {showHint === 'challenge' && <HintBox>{inline(lesson.challenge.hint)}</HintBox>}
            </div>
          )}
          {checkError && <Hint>Checks are waiting for code that runs.</Hint>}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Button size="sm" variant="secondary" onPress={() => setShowSolution((s) => !s)}>
              {showSolution ? 'Hide solution' : 'Show solution'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => confirm('Reset this lesson to the starter code? Your code and ticks for it will be cleared.') && onReset()}
            >
              Reset lesson
            </Button>
            {!done && (
              <TipButton size="sm" variant="secondary" tip="Mark done even if the checks disagree" onPress={() => onProgress({ status: 'done', manual: true })}>
                Mark done
              </TipButton>
            )}
          </div>
          {showSolution && <SolutionDiff lesson={lesson} />}
        </Panel>
        {(allPassed || done) && (
          <Panel title="You now know" className="border-success bg-success/15">
            <ul className="m-0 list-disc pl-5">
              {lesson.summary.map((s) => (
                <li key={s}>{inline(s)}</li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-2">
              {lesson.introduces.map((f) => (
                <Link key={f} href={`/reference#${encodeURIComponent(f.replace(/^\./, ''))}`} className="no-underline">
                  <Chip size="sm" className="font-mono hover:text-accent">
                    {f}
                  </Chip>
                </Link>
              ))}
            </div>
          </Panel>
        )}
        {lesson.number >= 10 && (
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="secondary" onPress={saveParts}>
              Save parts to library
            </Button>
            {saveNote && <Hint>{saveNote}</Hint>}
          </div>
        )}
        <nav className="flex flex-wrap items-center justify-between gap-3">
          {prev && (
            <Link href={`/learn/${prev.id}`} className={linkClass}>
              ◀ {prev.title}
            </Link>
          )}
          {next && (
            <Link href={`/learn/${next.id}`} className={cn(linkClass, 'ml-auto')}>
              {next.title} ▶
            </Link>
          )}
        </nav>
      </aside>
      <div className={cn('min-w-0', mobileTab === 'lesson' && 'max-[1100px]:hidden')}>
        <GuiPolicyProvider policy={policy}>
          <Workbench initialCode={initialCode} onEvaluated={(_p, code) => void runChecks(code)} panels={<BlockPanels />} />
        </GuiPolicyProvider>
      </div>
    </div>
  );
}

/** Compact ghost button that sits inline in task text. */
const inlineBtn = 'ml-1 h-6 min-w-0 px-2 align-middle text-xs text-muted';

/** A revealed hint: amber bar on the left. */
function HintBox({ children }: { children: ReactNode }) {
  return <div className="mt-1 border-l-[3px] border-warning bg-warning/15 px-2 py-1.5 text-[13px] text-foreground">{children}</div>;
}

const DIFF_LINE = { same: '', add: 'bg-success/30', del: 'bg-danger/25 text-code-foreground/75' } as const;

function SolutionDiff({ lesson }: { lesson: Lesson }) {
  const current = useEditorStore((s) => s.code);
  const lines = useMemo(() => lineDiff(current, lesson.solution), [current, lesson.solution]);
  return (
    <div className="mt-1 flex flex-col gap-1.5">
      <pre className="m-0 overflow-x-auto rounded-md bg-code p-2 font-mono text-xs text-code-foreground">
        {lines.map((l, i) => (
          <div key={i} className={DIFF_LINE[l.kind]}>
            {l.kind === 'add' ? '+ ' : l.kind === 'del' ? '- ' : '  '}
            {l.text}
          </div>
        ))}
      </pre>
      <Button
        size="sm"
        variant="primary"
        className="self-start"
        onPress={() => confirm('Replace your code with the solution?') && useEditorStore.getState().replaceAll(lesson.solution)}
      >
        Use this code
      </Button>
    </div>
  );
}

/** Minimal line diff (LCS) for showing the solution against the learner's code. */
function lineDiff(a: string, b: string): { kind: 'same' | 'add' | 'del'; text: string }[] {
  const x = a.split('\n');
  const y = b.split('\n');
  const dp = Array.from({ length: x.length + 1 }, () => Array(y.length + 1).fill(0));
  for (let i = x.length - 1; i >= 0; i--) for (let j = y.length - 1; j >= 0; j--) dp[i][j] = x[i] === y[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: { kind: 'same' | 'add' | 'del'; text: string }[] = [];
  let i = 0;
  let j = 0;
  while (i < x.length && j < y.length) {
    if (x[i] === y[j]) {
      out.push({ kind: 'same', text: x[i++] });
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ kind: 'del', text: x[i++] });
    else out.push({ kind: 'add', text: y[j++] });
  }
  while (i < x.length) out.push({ kind: 'del', text: x[i++] });
  while (j < y.length) out.push({ kind: 'add', text: y[j++] });
  return out;
}

function safe(fn: () => boolean): boolean {
  try {
    return fn();
  } catch {
    return false;
  }
}
