'use client';

import { Button, Input } from '@heroui/react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { Hint } from '@/components/ui/Hint';
import { linkClass } from '@/components/ui/Page';
import { Panel } from '@/components/ui/Panel';
import { formatFinding, type Finding } from '@/lib/lessons/validate';
import { usePacksStore } from '@/lib/stores/packs';

/** Add a lesson pack from a file or a URL. It's validated here, in the browser, before it shows on the map. */
export function PackImport() {
  const importPack = usePacksStore((s) => s.importPack);
  const importUrl = usePacksStore((s) => s.importUrl);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ title?: string; findings: Finding[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const finish = (r: { findings: Finding[]; pack?: { title: string } }) => {
    setResult({ title: r.pack?.title, findings: r.findings });
    setBusy(false);
  };

  return (
    <Panel title="More lessons">
      <Hint>
        Add a lesson pack someone shared (a <code>.json</code> file or a link). It’s checked here first: every step must run and every task must tick only
        when you do it. A pack’s code runs in your browser like anything you paste into the Sandbox, so add packs from people you trust.{' '}
        <Link href="/author" className={linkClass}>
          Write your own pack
        </Link>
        .
      </Hint>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            setBusy(true);
            try {
              finish(await importPack(JSON.parse(await f.text())));
            } catch (err) {
              finish({ findings: [{ level: 'error', message: `Not a JSON file: ${(err as Error).message}` }] });
            }
          }}
        />
        <Button size="sm" variant="secondary" isDisabled={busy} onPress={() => fileRef.current?.click()}>
          ⬆ Add from file
        </Button>
        <form
          className="flex min-w-0 flex-1 items-center gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!url.trim()) return;
            setBusy(true);
            finish(await importUrl(url.trim()));
          }}
        >
          <Input type="url" aria-label="Pack URL" placeholder="https://…/pack.json" className="min-w-0 flex-1 text-xs" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button size="sm" variant="secondary" type="submit" isDisabled={busy || !url.trim()}>
            {busy ? 'Checking…' : 'Add from URL'}
          </Button>
        </form>
      </div>
      {result && (
        <div className="text-xs">
          {result.title ? (
            <p className="m-0 text-success">Added “{result.title}”. It’s on the map above.</p>
          ) : (
            <p className="m-0 text-danger">Not added: the pack has problems.</p>
          )}
          {result.findings.length > 0 && (
            <ul className="m-0 mt-1 max-h-48 list-none overflow-y-auto p-0 font-mono text-[11px] text-muted">
              {result.findings.slice(0, 40).map((f, i) => (
                <li key={i}>{formatFinding(f)}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Panel>
  );
}
