'use client';

import { Chip, cn, Input, NumberField } from '@heroui/react';
import { useEffect, useState } from 'react';
import { Hint } from '@/components/ui/Hint';
import { SimpleSelect } from '@/components/ui/SimpleSelect';
import { getEngine } from '@/lib/audio/engine';
import { runGuiEdit } from '@/lib/stores/model';
import { addMember, addSection, moveArrangeRow, removeArrangeRow, removeMember, rewriteMember, setSectionBars } from '@/lib/sync/generate';
import type { ProjectModel, StackBlock } from '@/lib/sync/model';
import { findBlock } from '@/lib/sync/parseProject';
import { RemoveButton, SmallButton } from './SoundControls';

const CELL = 'border border-border p-[5px] text-center';
/** Marks the column playing now. */
const NOW = 'shadow-[inset_0_-3px_0_var(--success)]';

/**
 * Arrangement matrix (A-a): columns are the arrangement's sections in play order, rows are the
 * parts and groups. A cell is off, on, or on with a modifier; clicking cycles through those.
 * A section used twice (drop … drop) shares its cells, because both columns are the same const.
 */
export function ArrangementMatrix({ model }: { model: ProjectModel }) {
  const final = model.final;
  const playing = usePlayingColumn(model);
  if (final?.kind !== 'arrange') return null;

  const sections = final.rows.map((r) => ({ row: r, block: findBlock(model, r.section.name) }));
  const stacks = sections.map((s) => (s.block?.kind === 'section' ? (s.block as StackBlock) : null));
  const modifiers = model.blocks.filter((b) => b.kind === 'modifier').map((b) => b.name);
  const sectionNames = new Set(final.rows.map((r) => r.section.name));
  const rowNames = [
    ...new Set([
      ...stacks.flatMap((s) => s?.members.map((m) => m.base) ?? []),
      ...model.blocks.filter((b) => (b.kind === 'part' || b.kind === 'group' || b.kind === 'custom') && !sectionNames.has(b.name)).map((b) => b.name),
    ]),
  ];
  const totalBars = final.rows.reduce((sum, r) => sum + (r.bars.kind === 'number' ? r.bars.value : 0), 0);

  const cycleCell = (sectionName: string, rowName: string) =>
    runGuiEdit((m) => {
      const s = findBlock(m, sectionName);
      if (s?.kind !== 'section') return [];
      const i = s.members.findIndex((x) => x.base === rowName);
      if (i < 0) return addMember(m.code, s, rowName);
      const member = s.members[i];
      // off → on → each modifier → off
      const current = member.wrappers.length === 1 ? modifiers.indexOf(member.wrappers[0]) : member.wrappers.length ? -2 : -1;
      if (current === -2 || current === modifiers.length - 1) return removeMember(m.code, s, i);
      return rewriteMember(m.code, member, { wrappers: [modifiers[current + 1]] });
    });

  return (
    <section className="flex min-w-0 flex-col gap-2.5 rounded-lg border border-border bg-surface p-3" aria-label="Arrangement">
      <header className="flex flex-wrap items-center gap-2">
        <b>Arrangement</b>
        <Chip size="sm" variant="soft" color="success">
          GUI
        </Chip>
        <Hint>
          {totalBars} bars · click a cell: off → on{modifiers.length ? ' → with a modifier' : ''} → off
        </Hint>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className={CELL} />
              {sections.map(({ row }, ci) => (
                <th key={ci} className={cn(CELL, playing === ci && NOW)}>
                  <div className="font-mono text-[13px]">{row.section.name}</div>
                  <div className="flex items-center justify-center gap-1 text-xs font-normal text-muted">
                    <NumberField
                      key={row.bars.raw}
                      aria-label={`${row.section.name} length in bars`}
                      minValue={1}
                      maxValue={256}
                      defaultValue={row.bars.kind === 'number' ? row.bars.value : undefined}
                      formatOptions={{ useGrouping: false, maximumFractionDigits: 0 }}
                      onChange={(v) => !Number.isNaN(v) && runGuiEdit((m) => setSectionBars(m.code, m, ci, v))}
                    >
                      <NumberField.Group className="w-12">
                        <NumberField.Input className="w-full px-1 py-0.5 text-center font-mono text-[13px] sm:text-[13px]" />
                      </NumberField.Group>
                    </NumberField>
                    bars
                  </div>
                  <div className="flex items-center justify-center">
                    <SmallButton isIconOnly variant="ghost" className="w-7 px-0 text-muted md:w-7" aria-label="Move earlier" isDisabled={ci === 0} onPress={() => runGuiEdit((m) => moveArrangeRow(m.code, m, ci, -1))}>
                      ◀
                    </SmallButton>
                    <SmallButton
                      isIconOnly
                      variant="ghost"
                      className="w-7 px-0 text-muted md:w-7"
                      aria-label="Move later"
                      isDisabled={ci === sections.length - 1}
                      onPress={() => runGuiEdit((m) => moveArrangeRow(m.code, m, ci, 1))}
                    >
                      ▶
                    </SmallButton>
                    <RemoveButton label={`Remove ${row.section.name} from the arrangement`} onPress={() => runGuiEdit((m) => removeArrangeRow(m.code, m, ci))} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowNames.map((name) => (
              <tr key={name}>
                <th className={cn(CELL, 'text-left font-mono text-[13px] font-normal')}>{name}</th>
                {sections.map(({ row }, ci) => {
                  const stack = stacks[ci];
                  const member = stack?.members.find((x) => x.base === name);
                  const label = member ? (member.wrappers.length ? member.wrappers.join('∘') : '●') : '';
                  return (
                    <td
                      key={ci}
                      className={cn(
                        CELL,
                        'min-w-14 cursor-pointer text-accent',
                        member && (member.wrappers.length ? 'bg-custom/15 font-mono text-[11px] text-custom' : 'bg-accent-soft'),
                        !stack && 'cursor-not-allowed bg-[repeating-linear-gradient(45deg,transparent_0_6px,var(--default)_6px_12px)]',
                        playing === ci && NOW,
                      )}
                      onClick={() => stack && cycleCell(row.section.name, name)}
                      role="button"
                      aria-pressed={!!member}
                      aria-label={`${name} in ${row.section.name}`}
                      title={stack ? undefined : `${row.section.name} is custom code`}
                    >
                      {label}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddSection model={model} />
    </section>
  );
}

function AddSection({ model }: { model: ProjectModel }) {
  const [name, setName] = useState('');
  const taken = new Set(model.blocks.map((b) => b.name));
  const reuse = model.blocks.filter((b) => b.kind === 'section');
  const valid = /^[A-Za-z_$][\w$]*$/.test(name) && !taken.has(name);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        type="text"
        className="px-2 py-1 font-mono text-[13px] sm:text-[13px]"
        placeholder="newSection"
        value={name}
        size={12}
        spellCheck={false}
        onChange={(e) => setName(e.target.value)}
        aria-label="New section name"
      />
      <SmallButton
        isDisabled={!valid}
        onPress={() => {
          if (runGuiEdit((m) => addSection(m.code, m, name, 16))) setName('');
        }}
      >
        + section
      </SmallButton>
      {reuse.length > 0 && (
        <SimpleSelect
          value=""
          placeholder="+ repeat a section…"
          aria-label="Play an existing section again"
          options={reuse.map((b) => ({ value: b.name, label: b.name }))}
          onChange={(v) =>
            v &&
            runGuiEdit((m) => {
              if (m.final?.kind !== 'arrange') return [];
              const last = m.final.rows[m.final.rows.length - 1];
              const at = last ? last.range.to : m.final.closeParen;
              return [{ from: at, to: at, expected: '', insert: `${last ? ',\n  ' : ''}[16, ${v}]` }];
            })
          }
        />
      )}
    </div>
  );
}
/** Index of the arrangement column playing now (the arrangement loops over its total). */
function usePlayingColumn(model: ProjectModel): number {
  const [col, setCol] = useState(-1);
  const bars = model.final?.kind === 'arrange' ? model.final.rows.map((r) => (r.bars.kind === 'number' ? r.bars.value : 0)) : [];
  const key = bars.join(',');
  useEffect(() => {
    if (!key) return;
    const lengths = key.split(',').map(Number);
    const total = lengths.reduce((a, b) => a + b, 0);
    let off: (() => void) | undefined;
    let cancelled = false;
    getEngine().then((engine) => {
      if (cancelled) return;
      let last = -2;
      off = engine.onFrame((_h, cycle) => {
        let c = -1;
        if (engine.isPlaying() && total > 0) {
          let pos = cycle % total;
          c = lengths.findIndex((len) => (pos -= len) < 0);
        }
        if (c !== last) setCol((last = c));
      });
    });
    return () => {
      cancelled = true;
      off?.();
    };
  }, [key]);
  return col;
}
