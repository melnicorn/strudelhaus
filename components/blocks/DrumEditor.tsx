'use client';

import { useCallback, useState } from 'react';
import { SlideSwitch } from '@/components/hw/Switches';
import { Hint } from '@/components/ui/Hint';
import { SimpleSelect } from '@/components/ui/SimpleSelect';
import { SoundDrawer } from '@/components/sounds/SoundDrawer';
import { drumLabel, findMachine, KIT_PIECES } from '@/lib/sounds/catalog';
import { runGuiEdit } from '@/lib/stores/model';
import { removeCall, setControl, setRootArg } from '@/lib/sync/generate';
import { gridToMini, isCanonicalGrid, parseGrid, type Steps } from '@/lib/sync/miniGrid';
import type { PartBlock, ProjectModel } from '@/lib/sync/model';
import { findBlock, getCall } from '@/lib/sync/parseProject';
import { allows, useGuiPolicy } from './policy';
import { LCD_TRIGGER, StepGrid } from './StepGrid';
import { MiniInput, SmallButton } from './SoundControls';
import { useQueriedSteps } from './usePreview';

export function writeRoot(name: string, value: string) {
  return runGuiEdit((m) => {
    const b = findBlock(m, name);
    return b?.kind === 'part' ? setRootArg(m.code, b, value) : [];
  });
}

/** Drum part: step grid (D-a) or mini-notation text (D-b). */
export function DrumEditor({ part, model }: { part: PartBlock; model: ProjectModel }) {
  const [mode, setMode] = useState<'steps' | 'mini'>('steps');
  const [extraRows, setExtraRows] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const source = part.root.arg.kind === 'string' ? part.root.arg.value : null;
  const parsed = source !== null ? parseGrid(source) : null;
  const editable = !!parsed && !part.structureLocked;
  const queried = useQueriedSteps(model, part.name, !editable, (v) => String(v.s));
  const steps: Steps | null = editable ? parsed : queried.steps;
  const rows = [...new Set([...(steps ?? []).filter((s): s is string => !!s), ...extraRows])];
  if (!rows.length) rows.push(part.root.fn === 's' || part.root.fn === 'sound' ? 'bd' : 'x');

  const toggle = (row: string, i: number) => {
    if (!steps) return;
    const next = [...steps];
    next[i] = next[i] === row ? null : row;
    writeRoot(part.name, gridToMini(next));
  };

  // Swap a row's instrument in place: its steps keep their timing, only the sound name changes.
  const rename = (from: string, to: string) => {
    setExtraRows((r) => r.map((x) => (x === from ? to : x)));
    if (steps?.includes(from)) writeRoot(part.name, gridToMini(steps.map((s) => (s === from ? to : s))));
  };
  const drumRows = part.root.fn === 's' || part.root.fn === 'sound';

  const policy = useGuiPolicy();
  const [browsing, setBrowsing] = useState<{ row?: string } | null>(null);
  const bankArg = getCall(part, 'bank')?.args[0];
  const bank = bankArg?.kind === 'string' ? bankArg.value : '';
  const machine = findMachine(bank);
  const closeDrawer = useCallback(() => setBrowsing(null), []);
  const applyBank = (next: string) =>
    runGuiEdit((m) => {
      const b = findBlock(m, part.name);
      if (b?.kind !== 'part') return [];
      const call = getCall(b, 'bank');
      if (!next) return call ? removeCall(m.code, call) : [];
      return setControl(m.code, b, 'bank', next);
    });

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1">
        <SlideSwitch
          label="Edit as"
          value={mode}
          options={['steps', 'mini']}
          format={(o) => (o === 'steps' ? 'Steps' : 'Mini')}
          onChange={(v) => setMode(v as 'steps' | 'mini')}
          caption={null}
        />
        {drumRows && (
          <SmallButton className="ml-auto" onPress={() => setBrowsing({})}>
            Browse sounds…
          </SmallButton>
        )}
      </div>
      {browsing && (
        <SoundDrawer
          bank={bank}
          rows={rows}
          row={browsing.row}
          canChangeBank={allows(policy, 'bank') && (!bankArg || bankArg.kind === 'string')}
          canUseSounds={editable}
          onUseBank={applyBank}
          onUseSound={(from, to) => (from ? rename(from, to) : setExtraRows((r) => [...r, to]))}
          onClose={closeDrawer}
        />
      )}

      {mode === 'steps' && (
        <>
          {steps ? (
            <StepGrid
              steps={steps}
              rows={rows}
              readOnly={!editable}
              onToggle={toggle}
              label={`${part.name} steps`}
              rowLabel={drumLabel}
              rowChoices={editable && drumRows ? (machine?.sounds.map(([x]) => x) ?? KIT_PIECES) : undefined}
              onRename={rename}
              onBrowse={(row) => setBrowsing({ row })}
            />
          ) : (
            <Hint>
              {queried.loading ? 'Reading the pattern…' : 'This rhythm doesn’t fit a 16-step grid (it has notes between the steps, or changes every bar).'}
            </Hint>
          )}
          {editable && (
            <div className="flex flex-wrap items-center gap-3">
              <SimpleSelect
                value=""
                placeholder="+ row"
                aria-label="Add a sound row"
                triggerClassName={LCD_TRIGGER}
                onChange={(v) => v && setExtraRows((r) => [...r, v])}
                options={(machine?.sounds.map(([x]) => x) ?? KIT_PIECES)
                  .filter((d) => !rows.includes(d))
                  .map((d) => ({ value: d, label: drumLabel(d) }))}
              />
              {source && !isCanonicalGrid(source) && <Hint>The grid will tidy “{source}” into its own style when you click a step.</Hint>}
            </div>
          )}
          {!editable && part.structureLocked && (
            <Hint>
              View only: a timing function like <code>.{part.chain.find((c) => !c.known)?.method ?? 'fast'}()</code> changes what
              plays, so the grid shows the result instead of the written pattern.
            </Hint>
          )}
          {!editable && !part.structureLocked && steps && source !== null && (
            <div className="text-[13px]">
              {!confirming ? (
                <SmallButton onPress={() => setConfirming(true)}>Make editable as steps…</SmallButton>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="min-w-0 break-words">
                    Replace <code>&quot;{source}&quot;</code> with <code>&quot;{gridToMini(steps)}&quot;</code>? It sounds the same in bar 1, but your
                    notation will be rewritten.
                  </span>
                  <SmallButton variant="primary" onPress={() => (writeRoot(part.name, gridToMini(steps)), setConfirming(false))}>
                    Replace
                  </SmallButton>
                  <SmallButton onPress={() => setConfirming(false)}>Keep mine</SmallButton>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {mode === 'mini' && source !== null && (
        <div className="flex flex-col gap-1.5">
          <MiniInput value={source} onCommit={(v) => writeRoot(part.name, v)} size={40} aria-label={`${part.name} pattern`} />
          <MiniHelp />
        </div>
      )}
    </div>
  );
}

function MiniHelp() {
  return (
    <ul className="m-0 list-disc pl-[18px] text-xs text-muted">
      <li>
        <code>bd sd</code> steps share the bar equally · <code>~</code> rest · <code>[a b]</code> squeeze into one step
      </li>
      <li>
        <code>bd*4</code> repeat in one step · <code>&lt;a b&gt;</code> one per bar · <code>bd(3,8)</code> 3 hits spread over 8 ·{' '}
        <code>a, b</code> at the same time
      </li>
    </ul>
  );
}
