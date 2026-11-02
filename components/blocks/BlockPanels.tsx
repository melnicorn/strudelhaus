'use client';

import { Chip, cn } from '@heroui/react';
import { useModelStore } from '@/lib/stores/model';
import { orbitCollisions, undefinedReferences, unvoiceableChords } from '@/lib/sync/diagnostics';
import { ArrangementMatrix } from './ArrangementMatrix';
import { CustomCard, GroupCard, KeyCard, ModifierCard, PartCard } from './BlockCards';
import { useGuiPolicy } from './policy';

/** Every block in the code, each with the controls that fit it. */
export function BlockPanels({ only }: { only?: string[] }) {
  const { model, syntaxError } = useModelStore();
  const policy = useGuiPolicy();
  const diagnostics = [...orbitCollisions(model), ...undefinedReferences(model), ...unvoiceableChords(model)];
  const blocks = model.blocks.filter((b) => !only || only.includes(b.name));

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {syntaxError && (
        <div className="rounded-lg border border-danger bg-surface p-3" role="status">
          <Chip size="sm" variant="soft" color="danger">
            syntax error
          </Chip> {syntaxError.line ? `Line ${syntaxError.line}: ` : ''}
          controls are paused until the code parses again.
        </div>
      )}
      {diagnostics.length > 0 && (
        <ul className="m-0 list-disc rounded-lg border border-warning bg-warning/15 py-2 pr-3 pl-7">
          {diagnostics.map((d) => (
            <li key={d.message}>⚠ {d.message}</li>
          ))}
        </ul>
      )}
      <fieldset disabled={!!syntaxError} className={cn('m-0 flex min-w-0 flex-col gap-3 border-0 p-0', syntaxError && 'pointer-events-none opacity-55')}>
        {blocks.map((b) => {
          if (b.kind === 'part') return <PartCard key={b.name} part={b} model={model} />;
          if (b.kind === 'key') return <KeyCard key={b.name} block={b} model={model} />;
          if (b.kind === 'custom') return <CustomCard key={b.name} block={b} model={model} />;
          if (!policy.composition) return null;
          if (b.kind === 'modifier') return <ModifierCard key={b.name} mod={b} model={model} />;
          return <GroupCard key={b.name} group={b} model={model} />;
        })}
        {policy.composition && !only && <ArrangementMatrix model={model} />}
      </fieldset>
    </div>
  );
}
