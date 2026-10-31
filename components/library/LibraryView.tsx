'use client';

import { Button, Checkbox, Chip, cn, SearchField } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getEngine } from '@/lib/audio/engine';
import { exportData, mergeImport, readImport, type CollisionChoice } from '@/lib/storage/library';
import type { LibraryItem } from '@/lib/storage/schema';
import { useLibraryStore } from '@/lib/stores/library';
import { Hint } from '@/components/ui/Hint';
import { boxClass } from '@/components/ui/Page';
import { Panel } from '@/components/ui/Panel';
import { SimpleSelect } from '@/components/ui/SimpleSelect';
import { TipButton } from '@/components/ui/TipButton';

const KINDS = [
  { value: 'all', label: 'all kinds' },
  { value: 'part', label: 'parts' },
  { value: 'modifier', label: 'modifiers' },
  { value: 'group', label: 'groups' },
  { value: 'section', label: 'sections' },
];

/** Code that plays one library item on its own (with a key if it uses one). */
function previewCode(item: LibraryItem): string {
  const key = /\bkey\b/.test(item.code.replace(/^const\s+\w+/, '')) ? `const key = "${item.key ?? 'C:minor'}"\n` : '';
  return `setcpm(${item.bpmHint ?? 124}/4)\n${key}${item.code}\n${item.name}`;
}

export function LibraryView() {
  const store = useLibraryStore();
  const { load, loaded, items, projects, currentId } = store;
  useEffect(load, [load]);
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<string>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<{ items: LibraryItem[]; collisions: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (x) => (kind === 'all' || x.kind === kind) && (!q || [x.name, x.code, ...x.tags, x.role ?? ''].some((t) => t.toLowerCase().includes(q))),
    );
  }, [items, query, kind]);

  if (!loaded) return <p className="text-muted">Loading…</p>;

  const preview = async (item: LibraryItem) => {
    const engine = await getEngine();
    await engine.unlock();
    const r = await engine.evaluate(previewCode(item));
    setMessage(r.ok ? `Playing ${item.name}. Press Stop to end.` : `${item.name} needs other blocks to play: ${r.error.message}`);
  };

  const addToCurrent = (item: LibraryItem) => {
    const target = projects.find((p) => p.id === currentId);
    if (!target) return setMessage('Open the sandbox once to create a project first.');
    store.addToProject(target.id, item);
    setMessage(`Copied ${item.name} into “${target.name}”.`);
  };

  const combine = () => {
    const chosen = items.filter((x) => selected.has(x.id));
    const names = chosen.map((x) => x.name);
    const code = `setcpm(124/4)\nconst key = "C:minor"\n\n${chosen.map((x) => x.code).join('\n')}\n\nconst group = stack(${names.join(', ')})\ngroup\n`;
    const p = store.createProject(`Combined: ${names.join(' + ')}`.slice(0, 60), code);
    chosen.forEach((x) => store.markUpdated(p.id, x.name, x));
    router.push('/sandbox');
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(exportData(items, projects), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `strudel-workshop-library-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onFile = async (file: File) => {
    const r = readImport(await file.text(), items);
    if (!r.ok) return setMessage(r.error);
    const missing = r.missingRequirements.map((m) => `${m.item} needs ${m.missing.join(', ')}`).join('; ');
    if (missing) setMessage(`Note: ${missing}.`);
    if (r.collisions.length) setPendingImport({ items: r.file.items, collisions: r.collisions.length });
    else {
      store.setItems(mergeImport(items, r.file.items, 'skip'));
      setMessage(`Imported ${r.file.items.length} block(s).${missing ? ` ${missing}.` : ''}`);
    }
  };

  const resolveImport = (choice: CollisionChoice) => {
    if (!pendingImport) return;
    store.setItems(mergeImport(items, pendingImport.items, choice));
    setMessage(`Imported (${choice.replace('-', ' ')} for ${pendingImport.collisions} duplicate${pendingImport.collisions === 1 ? '' : 's'}).`);
    setPendingImport(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <Panel className="flex-row flex-wrap items-center gap-3">
        <SearchField value={query} onChange={setQuery} aria-label="Search the library" className="w-full sm:w-64">
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search name, code, tag…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <SimpleSelect value={kind} onChange={setKind} options={KINDS} aria-label="Kind" />
        <TipButton
          size="sm"
          variant="secondary"
          isDisabled={selected.size < 2}
          onPress={combine}
          tip={selected.size < 2 ? 'Select two or more blocks to combine' : 'Copy the selected blocks into a new sandbox project, stacked'}
        >
          Combine {selected.size || ''} into a group →
        </TipButton>
        <span className="ml-auto flex flex-wrap items-center gap-3">
          <Button size="sm" variant="secondary" onPress={() => fileRef.current?.click()}>
            Import JSON
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <Button size="sm" variant="secondary" onPress={exportAll} isDisabled={!items.length}>
            Export all
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onPress={async () => {
              (await getEngine()).stop();
              setMessage(null);
            }}
          >
            ■ Stop
          </Button>
        </span>
      </Panel>
      {message && (
        <p className="text-xs text-muted" role="status">
          {message}
        </p>
      )}
      {pendingImport && (
        <Panel className="flex-row flex-wrap items-center gap-3">
          {pendingImport.collisions} imported block(s) already exist.
          <Button size="sm" variant="secondary" onPress={() => resolveImport('keep-both')}>
            Keep both
          </Button>
          <Button size="sm" variant="secondary" onPress={() => resolveImport('replace')}>
            Replace mine
          </Button>
          <Button size="sm" variant="secondary" onPress={() => resolveImport('skip')}>
            Skip them
          </Button>
        </Panel>
      )}
      {items.length === 0 ? (
        <p className={boxClass}>
          Your library is empty. Save blocks from the sandbox (each block’s <b>save ⤓</b> button) or from lesson 10 onwards (<b>Save parts to library</b>).
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-3">
          {visible.map((item) => (
            <article key={item.id} className={cn(boxClass, 'flex flex-col gap-2')}>
              <header className="flex items-center justify-between gap-3">
                <b className="min-w-0 font-mono text-[13px] break-all">{item.name}</b>
                <Checkbox
                  aria-label={`Select ${item.name}`}
                  isSelected={selected.has(item.id)}
                  onChange={(checked) =>
                    setSelected((s) => {
                      const next = new Set(s);
                      if (checked) next.add(item.id);
                      else next.delete(item.id);
                      return next;
                    })
                  }
                >
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                  </Checkbox.Content>
                </Checkbox>
              </header>
              <div className="flex flex-wrap items-center gap-1">
                <Chip size="sm">{item.kind}</Chip>
                {item.role && <Chip size="sm">{item.role}</Chip>}
                {item.key && <Chip size="sm">{item.key}</Chip>}
                <Chip size="sm">v{item.version}</Chip>
                {item.tags.map((t) => (
                  <Chip key={t} size="sm">
                    {t}
                  </Chip>
                ))}
              </div>
              <pre className="m-0 max-h-[140px] overflow-auto font-mono text-xs whitespace-pre-wrap text-muted">{item.code}</pre>
              {item.requires.length > 0 && <Hint>needs: {item.requires.join(', ')}</Hint>}
              <div className="flex flex-wrap items-center gap-1.5">
                {item.kind === 'part' && (
                  <Button size="sm" variant="secondary" onPress={() => preview(item)}>
                    ▶ preview
                  </Button>
                )}
                <Button size="sm" variant="secondary" onPress={() => addToCurrent(item)}>
                  Copy into project
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => {
                    const tag = prompt('Add a tag');
                    if (tag?.trim()) store.setItems(items.map((x) => (x.id === item.id ? { ...x, tags: [...new Set([...x.tags, tag.trim()])] } : x)));
                  }}
                >
                  + tag
                </Button>
                <Button size="sm" variant="ghost" onPress={() => confirm(`Delete ${item.name} from your library?`) && store.deleteItem(item.id)}>
                  delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
