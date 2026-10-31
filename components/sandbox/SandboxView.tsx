'use client';

import { Button, Chip, cn } from '@heroui/react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BlockPanels } from '@/components/blocks/BlockPanels';
import { jumpTo, StatusChip } from '@/components/blocks/BlockCards';
import { LibraryActionsContext, type LibraryActions } from '@/components/blocks/libraryActions';
import { Hint } from '@/components/ui/Hint';
import { boxClass } from '@/components/ui/Page';
import { Panel } from '@/components/ui/Panel';
import { SimpleSelect } from '@/components/ui/SimpleSelect';
import { TipButton } from '@/components/ui/TipButton';
import { Workbench } from '@/components/workbench/Workbench';
import { updatesAvailable } from '@/lib/storage/library';
import { useEditorStore } from '@/lib/stores/editor';
import { useLibraryStore } from '@/lib/stores/library';
import { runGuiEdit, useModelStore } from '@/lib/stores/model';
import { FINAL_PART } from '@/lib/sync/model';
import { findBlock } from '@/lib/sync/parseProject';
import { STARTER } from './starter';

export function SandboxView() {
  const { load, loaded, projects, currentId, items, createProject } = useLibraryStore();
  useEffect(load, [load]);
  useEffect(() => {
    if (loaded && projects.length === 0) createProject('My first jam', STARTER);
  }, [loaded, projects.length, createProject]);
  const project = projects.find((p) => p.id === currentId) ?? null;
  const projectId = project?.id;

  // Autosave the code into the current project.
  useEffect(() => {
    if (!projectId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = useEditorStore.subscribe(({ code }) => {
      clearTimeout(timer);
      timer = setTimeout(() => useLibraryStore.getState().saveCode(code), 500);
    });
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [projectId]);

  const [note, setNote] = useState<string | null>(null);
  const actions = useMemo<LibraryActions | null>(() => {
    if (!project) return null;
    return {
      save(name) {
        const item = useLibraryStore.getState().saveBlock(useEditorStore.getState().code, name, { tags: [project.name] });
        setNote(item ? `Saved “${name}” to your library (version ${item.version}).` : `“${name}” can’t be saved.`);
      },
      update(name) {
        return updatesAvailable(project, items).find((u) => u.name === name)?.item;
      },
      applyUpdate(name, item) {
        const incoming = item.code.replace(/^(\s*const\s+)[A-Za-z_$][\w$]*/, `$1${name}`);
        if (!confirm(`Replace “${name}” with library version ${item.version}?\n\n${incoming}`)) return;
        const ok = runGuiEdit((m) => {
          const b = findBlock(m, name);
          return b ? [{ from: b.range.from, to: b.range.to, expected: m.code.slice(b.range.from, b.range.to), insert: incoming }] : [];
        });
        if (ok) useLibraryStore.getState().markUpdated(project.id, name, item);
      },
    };
  }, [project, items]);

  if (!loaded || !project) return <p>Loading…</p>;

  return (
    <LibraryActionsContext.Provider value={actions}>
      <ProjectBar />
      {note && (
        <p className="m-0 mb-3 text-xs text-muted" role="status">
          {note}
        </p>
      )}
      <div className="grid grid-cols-[190px_minmax(0,1fr)] items-start gap-4 max-[1100px]:grid-cols-[minmax(0,1fr)]">
        <BlockOutline />
        <Workbench key={project.id} initialCode={project.code} panels={<BlockPanels />} />
      </div>
    </LibraryActionsContext.Provider>
  );
}

function ProjectBar() {
  const { projects, currentId, selectProject, createProject, renameProject, deleteProject } = useLibraryStore();
  const current = projects.find((p) => p.id === currentId);
  return (
    <Panel className="mb-3 flex-row flex-wrap items-center gap-2">
      <div className="flex min-w-0 items-center gap-1.5">
        <span>Project</span>
        <SimpleSelect
          aria-label="Project"
          value={currentId ?? ''}
          onChange={selectProject}
          options={projects.map((p) => ({ value: p.id, label: p.name }))}
          className="min-w-0"
          triggerClassName="min-w-40"
        />
      </div>
      <Button size="sm" variant="secondary" onPress={() => createProject(`Jam ${projects.length + 1}`, STARTER)}>
        New
      </Button>
      <Button size="sm" variant="secondary" onPress={() => createProject(`Empty ${projects.length + 1}`, 'setcpm(124/4)\n\n')}>
        New empty
      </Button>
      {current && (
        <>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              const name = prompt('Project name', current.name);
              if (name?.trim()) renameProject(current.id, name.trim());
            }}
          >
            Rename
          </Button>
          <TipButton
            size="sm"
            variant="secondary"
            isDisabled={projects.length < 2}
            tip={projects.length < 2 ? 'Keep at least one project' : undefined}
            onPress={() => confirm(`Delete “${current.name}”? This can’t be undone.`) && deleteProject(current.id)}
          >
            Delete
          </TipButton>
        </>
      )}
      <Hint className="ml-auto">Saved in this browser automatically.</Hint>
    </Panel>
  );
}

const outlineRow = 'flex w-full items-center justify-between gap-1.5 rounded px-1 py-0.5 text-left';

function BlockOutline() {
  const { model, syntaxError } = useModelStore();
  const groups: [string, string[]][] = [
    ['parts', ['part']],
    ['modifiers', ['modifier']],
    ['groups', ['group']],
    ['sections', ['section']],
    ['other code', ['custom', 'key']],
  ];
  return (
    <nav className={cn(boxClass, 'sticky top-2 flex flex-col gap-1 max-[1100px]:hidden')} aria-label="Blocks in the code">
      <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">Blocks</h3>
      {syntaxError && (
        <Chip size="sm" color="danger" className="self-start">
          syntax error
        </Chip>
      )}
      {model.tempo && <div className={cn(outlineRow, 'font-mono text-[13px]')}>tempo {model.tempo.bpm ?? 'custom'}</div>}
      {groups.map(([label, kinds]) => {
        const blocks = model.blocks.filter((b) => kinds.includes(b.kind));
        if (!blocks.length) return null;
        return (
          <div key={label}>
            <OutlineGroup>{label}</OutlineGroup>
            {blocks.map((b) => (
              <Button
                key={b.name}
                variant="ghost"
                className={cn(outlineRow, 'h-auto min-h-0 font-normal text-foreground hover:bg-default')}
                onPress={() => jumpTo(b)}
              >
                <span className="truncate font-mono text-[13px]">{b.name === FINAL_PART ? 'last line' : b.name}</span>
                <StatusChip status={b.status} />
              </Button>
            ))}
          </div>
        );
      })}
      {model.final && model.final.kind !== 'part' && (
        <div>
          <OutlineGroup>plays</OutlineGroup>
          <div className={cn(outlineRow, 'font-mono text-[13px]')}>
            {model.final.kind} <StatusChip status={model.final.status} />
          </div>
        </div>
      )}
    </nav>
  );
}

function OutlineGroup({ children }: { children: ReactNode }) {
  return <div className="mt-2 text-[11px] text-muted uppercase">{children}</div>;
}
