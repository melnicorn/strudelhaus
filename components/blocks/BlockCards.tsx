'use client';

import { Chip, Slider } from '@heroui/react';
import type { ReactNode } from 'react';
import { Hint } from '@/components/ui/Hint';
import { SimpleSelect } from '@/components/ui/SimpleSelect';
import { getEngine } from '@/lib/audio/engine';
import { useEditorStore } from '@/lib/stores/editor';
import { runGuiEdit } from '@/lib/stores/model';
import { addMember, removeMember, rewriteMember } from '@/lib/sync/generate';
import { parseGrid } from '@/lib/sync/miniGrid';
import { FINAL_PART, type Block, type CustomBlock, type KeyBlock, type Member, type ModifierBlock, type PartBlock, type ProjectModel, type StackBlock } from '@/lib/sync/model';
import { findBlock } from '@/lib/sync/parseProject';
import { DrumEditor, writeRoot } from './DrumEditor';
import { useLibraryActions } from './libraryActions';
import { AcidSequencer, ChordEditor, DegreeTracker } from './PitchEditors';
import { CustomChip, MiniInput, SmallButton, SoundControls } from './SoundControls';
import { soloCode } from './usePreview';

const STATUS_LABEL = { gui: 'GUI', partial: 'partly custom', custom: 'custom code' } as const;

export function StatusChip({ status }: { status: Block['status'] }) {
  if (status === 'custom') return <CustomChip>{STATUS_LABEL[status]}</CustomChip>;
  return (
    <Chip size="sm" variant="soft" color={status === 'gui' ? 'success' : 'warning'}>
      {STATUS_LABEL[status]}
    </Chip>
  );
}

/** A plain grey label chip ("drums", "orbit 2"). */
function Tag({ children }: { children: ReactNode }) {
  return <Chip size="sm">{children}</Chip>;
}

const NAME = 'font-mono text-[13px]';

/** Scrolls the editor to a block and selects its name. */
export function jumpTo(block: Block) {
  const view = useEditorStore.getState().view;
  if (!view) return;
  const at = Math.min(block.range.from, view.state.doc.length);
  view.dispatch({ selection: { anchor: at }, scrollIntoView: true });
  view.focus();
}

/** Plays just this block (with everything it needs) until Stop or the next Play. */
async function solo(model: ProjectModel, name: string) {
  const engine = await getEngine();
  await engine.unlock();
  await engine.evaluate(soloCode(model, name));
}

function Card({ block, model, kind, children, actions }: { block: Block; model: ProjectModel; kind: string; children?: ReactNode; actions?: ReactNode }) {
  const library = useLibraryActions();
  const savable = library && block.name !== FINAL_PART && block.kind !== 'key';
  const update = savable ? library.update(block.name) : undefined;
  return (
    <section
      className="flex min-w-0 flex-col gap-2.5 rounded-lg border border-border bg-surface p-3"
      aria-label={`${kind} ${block.name === FINAL_PART ? 'last line' : block.name}`}
    >
      <header className="flex flex-wrap items-center gap-2">
        <b className={NAME} title={block.name === FINAL_PART ? 'The last line of the code: what plays' : undefined}>
          {block.name === FINAL_PART ? 'last line' : block.name}
        </b>
        <StatusChip status={block.status} />
        <Tag>{kind}</Tag>
        <span className="ml-auto flex flex-wrap items-center gap-1.5">
          {actions}
          {update && (
            <SmallButton
              className="h-6 rounded-full bg-warning/15 text-warning md:h-6"
              tip="This block came from your library, which now has a newer version"
              onPress={() => library!.applyUpdate(block.name, update)}
            >
              library v{update.version} available
            </SmallButton>
          )}
          {savable && (
            <SmallButton variant="ghost" className="text-muted" tip="Save this block to your library" onPress={() => library!.save(block.name)}>
              save ⤓
            </SmallButton>
          )}
          {block.kind !== 'key' && block.kind !== 'modifier' && block.name !== FINAL_PART && (
            <SmallButton tip="Play only this" onPress={() => solo(model, block.name)}>
              ▶ solo
            </SmallButton>
          )}
          <SmallButton variant="ghost" className="text-muted" tip="Show in the code" onPress={() => jumpTo(block)}>
            code ↗
          </SmallButton>
        </span>
      </header>
      {block.notes.length > 0 && (
        <ul className="m-0 list-disc pl-[18px] text-xs text-custom">
          {block.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
      {children}
    </section>
  );
}

function orbitOf(block: PartBlock | ModifierBlock): number | null {
  const call = block.chain.find((c) => c.method === 'orbit');
  return call?.args[0]?.kind === 'number' ? call.args[0].value : null;
}

export function PartCard({ part, model }: { part: PartBlock; model: ProjectModel }) {
  const fn = part.root.fn;
  const src = part.root.arg.kind === 'string' ? part.root.arg.value : null;
  let editor: ReactNode;
  let hide: string[] = [];
  if (fn === 's' || fn === 'sound') {
    editor = <DrumEditor part={part} model={model} />;
  } else if (fn === 'note' && src !== null && parseGrid(src) && !part.structureLocked) {
    editor = <AcidSequencer part={part} />;
    hide = ['velocity', 'lpenv', 'penv'];
  } else if (fn === 'n' && src !== null && parseGrid(src) && !part.structureLocked) {
    editor = <DegreeTracker part={part} />;
  } else if (fn === 'chord') {
    editor = <ChordEditor part={part} model={model} />;
  } else if (src !== null) {
    editor = (
      <div className="flex flex-wrap items-center gap-3">
        <span className={`${NAME} min-w-[108px]`}>{fn}(…)</span>
        <MiniInput value={src} size={44} onCommit={(v) => writeRoot(part.name, v)} aria-label={`${part.name} pattern`} />
      </div>
    );
  }
  const orbit = orbitOf(part);
  return (
    <Card block={part} model={model} kind={fn === 's' || fn === 'sound' ? 'drums' : fn === 'chord' ? 'chords' : 'pitched'} actions={orbit ? <Tag>orbit {orbit}</Tag> : null}>
      {editor}
      <SoundControls block={part} hide={hide} />
    </Card>
  );
}

export function ModifierCard({ mod, model }: { mod: ModifierBlock; model: ProjectModel }) {
  const usedBy = model.blocks.flatMap((b) =>
    b.kind === 'group' || b.kind === 'section' ? b.members.filter((m) => m.wrappers.includes(mod.name)).map((m) => `${b.name}: ${m.base}`) : [],
  );
  return (
    <Card block={mod} model={model} kind="modifier">
      <Hint>
        A function: <code>{mod.name}(part)</code> returns the part with these effects added. Apply it to a part in a group or the arrangement.
      </Hint>
      <SoundControls block={mod} />
      <Hint>{usedBy.length ? `Used by ${usedBy.join(', ')}` : 'Not used yet.'}</Hint>
    </Card>
  );
}

export function CustomCard({ block, model }: { block: CustomBlock; model: ProjectModel }) {
  const code = model.code.slice(block.initRange.from, block.initRange.to);
  return (
    <Card block={block} model={model} kind="code">
      <pre className="m-0 font-mono text-[13px] break-words whitespace-pre-wrap text-muted">{code.length > 240 ? code.slice(0, 240) + '…' : code}</pre>
    </Card>
  );
}

const TONICS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const MODES = ['minor', 'major', 'dorian', 'phrygian', 'minor:pentatonic'];
const withCurrent = (list: string[], current: string) => list.concat(list.includes(current) ? [] : [current]).map((v) => ({ value: v, label: v }));

export function KeyCard({ block, model }: { block: KeyBlock; model: ProjectModel }) {
  const value = block.value.kind === 'string' ? block.value.value : '';
  const [tonic, mode] = value.split(':');
  const set = (next: string) =>
    runGuiEdit((m) => {
      const b = findBlock(m, 'key');
      return b?.kind === 'key' ? [{ from: b.value.range.from, to: b.value.range.to, expected: m.code.slice(b.value.range.from, b.value.range.to), insert: `"${next}"` }] : [];
    });
  return (
    <Card block={block} model={model} kind="key">
      <div className="flex flex-wrap items-center gap-3">
        <SimpleSelect value={tonic} aria-label="Key root" onChange={(v) => set(`${v}:${mode ?? 'minor'}`)} options={withCurrent(TONICS, tonic)} />
        <SimpleSelect value={mode} aria-label="Scale" onChange={(v) => set(`${tonic}:${v}`)} options={withCurrent(MODES, mode)} />
        <Hint>
          Parts written with <code>.scale(key)</code> follow this.
        </Hint>
      </div>
    </Card>
  );
}

// ---------- groups (G-a mixer) ----------

function stackOf(m: ProjectModel, name: string): StackBlock | null {
  const b = findBlock(m, name);
  return b?.kind === 'group' || b?.kind === 'section' ? b : null;
}

export function editMember(stackName: string, index: number, change: { wrappers?: string[]; postgain?: number }) {
  return runGuiEdit((m) => {
    const s = stackOf(m, stackName);
    const member = s?.members[index];
    return member ? rewriteMember(m.code, member, change) : [];
  });
}

export function GroupCard({ group, model }: { group: StackBlock; model: ProjectModel }) {
  const modifiers = model.blocks.filter((b): b is ModifierBlock => b.kind === 'modifier');
  const available = model.blocks.filter(
    (b) => (b.kind === 'part' || b.kind === 'custom' || b.kind === 'group') && b.name !== group.name && !group.members.some((m) => m.base === b.name),
  );
  return (
    <Card block={group} model={model} kind={group.kind}>
      <div className="flex flex-wrap items-stretch gap-2">
        {group.members.map((member, i) => (
          <Strip key={`${member.base}:${i}`} member={member} index={i} group={group} model={model} modifiers={modifiers} />
        ))}
        {available.length > 0 && (
          <SimpleSelect
            className="w-[108px]"
            triggerClassName="h-full justify-center border border-dashed border-border bg-surface text-muted shadow-none"
            value=""
            placeholder="+ add"
            aria-label={`Add to ${group.name}`}
            onChange={(v) => v && runGuiEdit((m) => (stackOf(m, group.name) ? addMember(m.code, stackOf(m, group.name)!, v) : []))}
            options={available.map((b) => ({ value: b.name, label: b.name }))}
          />
        )}
      </div>
    </Card>
  );
}

function Strip({ member, index, group, model, modifiers }: { member: Member; index: number; group: StackBlock; model: ProjectModel; modifiers: ModifierBlock[] }) {
  const base = findBlock(model, member.base);
  const level = member.postgain?.kind === 'number' ? member.postgain.value : 1;
  const ownPostgain = base?.kind === 'part' && base.chain.some((c) => c.method === 'postgain');
  const orbit = base && (base.kind === 'part' || base.kind === 'modifier') ? orbitOf(base) : null;
  return (
    <div className="flex w-[108px] flex-col items-center gap-1.5 rounded-md border border-border bg-surface p-2 text-center">
      <div className={`${NAME} max-w-full truncate font-semibold`}>{member.base}</div>
      <div className="flex h-24 justify-center" title={ownPostgain ? `${member.base} sets .postgain itself; change it there` : 'Level in this group (writes .postgain)'}>
        <Slider
          key={level}
          orientation="vertical"
          className="h-full"
          minValue={0}
          maxValue={150}
          defaultValue={Math.round(level * 100)}
          isDisabled={ownPostgain}
          aria-label={`${member.base} level`}
          onChangeEnd={(v) => editMember(group.name, index, { postgain: (Array.isArray(v) ? v[0] : v) / 100 })}
        >
          <Slider.Track>
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
      </div>
      <div className={NAME}>{level.toFixed(2).replace(/^0/, '')}</div>
      {member.wrappers.map((w, wi) => (
        <SmallButton
          key={w + wi}
          className="h-6 max-w-full rounded-full bg-custom/15 font-mono text-custom md:h-6"
          tip="Remove this modifier"
          onPress={() => editMember(group.name, index, { wrappers: member.wrappers.filter((_, j) => j !== wi) })}
        >
          {w} ✕
        </SmallButton>
      ))}
      {modifiers.length > 0 && (
        <SimpleSelect
          className="w-full min-w-0"
          triggerClassName="px-2 text-xs"
          value=""
          placeholder="+ modifier"
          aria-label={`Apply a modifier to ${member.base}`}
          onChange={(v) => v && editMember(group.name, index, { wrappers: [v, ...member.wrappers] })}
          options={modifiers.map((m) => ({ value: m.name, label: m.name }))}
        />
      )}
      {orbit && <Tag>orbit {orbit}</Tag>}
      <SmallButton
        variant="ghost"
        className="text-muted"
        aria-label={`Remove ${member.base} from ${group.name}`}
        onPress={() => runGuiEdit((m) => (stackOf(m, group.name) ? removeMember(m.code, stackOf(m, group.name)!, index) : []))}
      >
        remove
      </SmallButton>
    </div>
  );
}
