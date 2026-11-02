'use client';

import { Button, TextArea } from '@heroui/react';
import { useRef, useState } from 'react';
import { Hint } from '@/components/ui/Hint';
import { Panel } from '@/components/ui/Panel';
import { applyBackup, loadState, makeBackup, readBackup, saveState, summarize, toCode, type BackupMode } from '@/lib/storage/backup';
import type { BackupFile } from '@/lib/storage/schema';
import { useLibraryStore } from '@/lib/stores/library';
import { useProgressStore } from '@/lib/stores/progress';
import { useSettingsStore } from '@/lib/stores/settings';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Re-read every store from storage after an import. */
function reloadStores() {
  useProgressStore.setState({ loaded: false });
  useSettingsStore.setState({ loaded: false });
  useLibraryStore.setState({ loaded: false });
  useProgressStore.getState().load();
  useSettingsStore.getState().load();
  useLibraryStore.getState().load();
}

/** Download/copy everything this browser keeps, and load it on another computer. */
export function MoveProgress() {
  const progress = useProgressStore((s) => s.progress);
  const [pasted, setPasted] = useState('');
  /** Shown when the clipboard is blocked, to copy by hand. */
  const [code, setCode] = useState<string | null>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [message, setMessage] = useState<{ text: string; tone?: 'danger' } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const touched = Object.keys(progress).length;
  const done = Object.values(progress).filter((p) => p.status === 'done').length;

  const download = () => {
    const blob = new Blob([JSON.stringify(makeBackup(loadState()), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `strudel-workshop-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copy = async () => {
    const next = await toCode(makeBackup(loadState()));
    try {
      await navigator.clipboard.writeText(next);
      setCode(null);
      setMessage({ text: 'Copied. Paste it into the box under “Bring it here” on the other computer.' });
    } catch {
      setCode(next);
      setMessage({ text: 'Your browser blocked the clipboard: select the code and copy it yourself.', tone: 'danger' });
    }
  };

  const read = async (text: string) => {
    const r = await readBackup(text);
    if (!r.ok) {
      setPending(null);
      return setMessage({ text: r.error, tone: 'danger' });
    }
    setMessage(null);
    setPending(r.file);
  };

  const apply = (mode: BackupMode) => {
    if (!pending) return;
    const saved = saveState(applyBackup(loadState(), pending, mode));
    reloadStores();
    setPending(null);
    setPasted('');
    setMessage(saved ? { text: mode === 'merge' ? 'Merged. Newer copies won, lesson by lesson.' : 'Loaded. Everything here now matches the file.' } : { text: 'Saving failed: your browser isn’t letting this site save.', tone: 'danger' });
  };

  const summary = pending && summarize(pending, loadState());

  return (
    <Panel title="Move your progress">
      <Hint>
        Your progress, library and sandbox projects are saved in this browser only. To carry on from another computer, take them with you as a file or a code.
      </Hint>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <strong className="text-sm">Take it with you</strong>
          <Hint>
            {plural(touched, 'lesson')} touched, {done} done, with your code for each.
          </Hint>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onPress={download}>
              ⬇ Download file
            </Button>
            <Button size="sm" variant="secondary" onPress={copy}>
              Copy as code
            </Button>
          </div>
          {code && (
            <TextArea aria-label="Your progress code" value={code} readOnly onFocus={(e) => e.target.select()} className="h-16 font-mono text-xs" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <strong className="text-sm">Bring it here</strong>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onPress={() => fileRef.current?.click()}>
              ⬆ Upload file
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) await read(await file.text());
              }}
            />
            <Hint>or paste a code:</Hint>
          </div>
          <TextArea
            aria-label="Progress code"
            placeholder="Paste a progress code…"
            value={pasted}
            onChange={(e) => {
              setPasted(e.target.value);
              if (e.target.value.trim()) void read(e.target.value);
              else setPending(null);
            }}
            className="h-16 font-mono text-xs"
          />
          {pending && summary && (
            <div className="flex flex-col gap-2 rounded-lg border border-success p-2.5 text-sm">
              <div>
                <strong>From {new Date(pending.exportedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}:</strong>{' '}
                {plural(summary.lessons, 'lesson')}, {summary.done} done, {plural(summary.items, 'library block')}, {plural(summary.projects, 'project')}.
              </div>
              {summary.newerHere > 0 && <Hint>{plural(summary.newerHere, 'lesson')} here {summary.newerHere === 1 ? 'is' : 'are'} newer than the file’s: a merge keeps them.</Hint>}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onPress={() => apply('merge')}>
                  Merge (newer wins)
                </Button>
                <Button size="sm" variant="secondary" onPress={() => apply('replace')}>
                  Replace everything here
                </Button>
                <Button size="sm" variant="ghost" onPress={() => setPending(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {message && <Hint tone={message.tone}>{message.text}</Hint>}
    </Panel>
  );
}
