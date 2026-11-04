'use client';

import { Button, Chip, cn } from '@heroui/react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { Hint } from '@/components/ui/Hint';
import { boxClass, linkClass } from '@/components/ui/Page';
import { Panel } from '@/components/ui/Panel';
import template from '@/content/packs/template.json';
import { lessonHref, registerPack, unregisterPack } from '@/lib/lessons/packs';
import type { Pack } from '@/lib/lessons/types';
import { formatFinding, validatePack, type Finding } from '@/lib/lessons/validate';
import { KEYS, readJson, writeJson } from '@/lib/storage/kv';
import { z } from 'zod';
import { useAssistantStore } from '@/lib/stores/assistant';
import { useEditorStore } from '@/lib/stores/editor';
import { usePacksStore } from '@/lib/stores/packs';

const TEMPLATE = JSON.stringify(template, null, 2);

/**
 * Write a lesson pack as JSON, validate it here, try its lessons, and download it to share.
 * The assistant sees the JSON and the findings, so "fix the check on task 2" works.
 */
export function AuthorView() {
  const [initial] = useState(() => readJson(KEYS.author, z.string(), '') || TEMPLATE);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [draft, setDraft] = useState<Pack | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const draftId = useRef<string | null>(null);
  const importPack = usePacksStore((s) => s.importPack);
  const assistantOn = useAssistantStore((s) => s.config.mode !== 'closed');

  // The draft pack is registered so its lessons open from here; it's removed again on leaving.
  const dropDraft = useCallback(() => {
    if (draftId.current) unregisterPack(draftId.current);
    draftId.current = null;
    setDraft(null);
  }, []);
  useEffect(() => dropDraft, [dropDraft]);

  const validate = useCallback(async () => {
    const text = useEditorStore.getState().code;
    setBusy(true);
    setNote(null);
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch (e) {
      setFindings([{ level: 'error', message: `Not valid JSON: ${(e as Error).message}` }]);
      setBusy(false);
      dropDraft();
      return;
    }
    const r = await validatePack(json);
    setFindings(r.findings);
    dropDraft();
    if (r.pack && !r.errors) {
      registerPack(r.pack);
      draftId.current = r.pack.id;
      setDraft(r.pack);
    }
    setBusy(false);
  }, [dropDraft]);

  // Save the draft as you type, and tell the assistant what it's looking at.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = useEditorStore.subscribe(({ code }) => {
      clearTimeout(timer);
      timer = setTimeout(() => writeJson(KEYS.author, code), 400);
    });
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);
  useEffect(() => {
    const summary = findings === null ? 'Not validated yet: press Validate.' : findings.length ? `Validator findings:\n${findings.map(formatFinding).join('\n')}` : 'Validator: no findings; the pack is sound.';
    useEditorStore.getState().setContext({ mode: 'edit', label: 'Lesson pack author (the editor holds a lesson pack as JSON, not Strudel code)', about: summary });
  }, [findings]);
  useEffect(() => () => useEditorStore.getState().setContext(null), []);

  const download = () => {
    const text = useEditorStore.getState().code;
    let name = 'pack';
    try {
      name = String((JSON.parse(text) as { id?: string }).id ?? name);
    } catch {
      // keep the default name
    }
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `${name}.json` });
    a.click();
    URL.revokeObjectURL(url);
  };

  const errors = findings?.filter((f) => f.level === 'error') ?? [];
  return (
    <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(300px,1fr)] items-start gap-4 max-[1000px]:grid-cols-1">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onPress={() => void validate()} isDisabled={busy}>
            {busy ? 'Validating…' : 'Validate'}
          </Button>
          <Button size="sm" variant="secondary" onPress={download}>
            ⬇ Download
          </Button>
          <Button
            size="sm"
            variant="secondary"
            isDisabled={!draft}
            onPress={async () => {
              const r = await importPack(JSON.parse(useEditorStore.getState().code));
              setNote(r.pack ? `Added “${r.pack.title}” to your Learn page.` : 'Not added: fix the findings first.');
            }}
          >
            Add to my Learn page
          </Button>
          <Button size="sm" variant="ghost" onPress={() => confirm('Replace the editor with the template pack?') && useEditorStore.getState().replaceAll(TEMPLATE)}>
            Start from the template
          </Button>
        </div>
        <CodeEditor language="json" ariaLabel="Lesson pack JSON" initialCode={initial} onToggle={() => void validate()} onUpdate={() => void validate()} onStop={() => undefined} className="[&_.cm-editor]:max-h-[75cqh]" />
        <Hint>Ctrl/Cmd+Enter validates. The draft is kept in this browser.</Hint>
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <Panel title="How it works">
          <p className="m-0 text-sm">
            A pack is JSON: tracks of lessons, each with a starter, tasks with hints and checks, the code after each step, and a solution.
            Checks say what the code must <i>play</i>, so any way of writing the same music passes. Validate walks every lesson the way a
            learner would: each task may tick only when it’s done.
          </p>
          <p className="m-0 text-sm">
            {assistantOn ? 'The assistant can see this JSON and the findings: ask it to write a lesson or fix a check.' : 'Turn on the assistant (top right) and it can write lessons and fix checks with you.'}{' '}
            The check language is described in{' '}
            <Link href="/about#packs" className={linkClass}>
              About
            </Link>
            .
          </p>
        </Panel>
        <Panel
          title="Findings"
          actions={
            findings && (
              <Chip size="sm" color={errors.length ? 'danger' : 'success'} variant="soft">
                {errors.length ? `${errors.length} error${errors.length === 1 ? '' : 's'}` : 'sound'}
              </Chip>
            )
          }
        >
          {findings === null ? (
            <Hint>Press Validate.</Hint>
          ) : findings.length === 0 ? (
            <Hint>No findings.</Hint>
          ) : (
            <ul className="m-0 max-h-[40cqh] list-none overflow-y-auto p-0 font-mono text-[11px]">
              {findings.map((f, i) => (
                <li key={i} className={cn(f.level === 'error' ? 'text-danger' : 'text-muted')}>
                  {formatFinding(f)}
                </li>
              ))}
            </ul>
          )}
          {note && <Hint>{note}</Hint>}
        </Panel>
        {draft && (
          <Panel title={`Try it: ${draft.title}`}>
            {draft.tracks.map((t) => (
              <div key={t.id} className="flex flex-col gap-1">
                <strong className="text-sm">{t.title}</strong>
                <div className="flex flex-wrap gap-1.5">
                  {t.lessons.map((l) => (
                    <Link key={l.id} href={lessonHref(l)} className={cn(boxClass, 'p-2 text-sm no-underline hover:bg-surface-secondary')}>
                      {l.number}. {l.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <Hint>Lessons open in this tab; come back here to keep editing (the draft is saved).</Hint>
          </Panel>
        )}
      </div>
    </div>
  );
}
