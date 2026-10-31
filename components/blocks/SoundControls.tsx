'use client';

import { Chip, cn, Input, Slider, type ButtonProps } from '@heroui/react';
import type { ReactNode } from 'react';
import { Hint } from '@/components/ui/Hint';
import { SimpleSelect } from '@/components/ui/SimpleSelect';
import { TipButton } from '@/components/ui/TipButton';
import { useDraft } from '@/lib/hooks/useDraft';
import { runGuiEdit } from '@/lib/stores/model';
import { METHODS, type MethodGroup, type MethodSpec } from '@/lib/sync/allowlist';
import { addMethod, removeCall, setCallArg } from '@/lib/sync/generate';
import { formatNumber, numberSeqToMini, parseNumberSeq } from '@/lib/sync/miniGrid';
import type { ChainCall, ModifierBlock, PartBlock } from '@/lib/sync/model';
import { findBlock } from '@/lib/sync/parseProject';
import { allows, useGuiPolicy } from './policy';

type Editable = PartBlock | ModifierBlock;

/** Re-finds the block in a fresh model so edits always use current ranges. */
function onBlock(name: string, fn: (code: string, block: Editable) => ReturnType<typeof setCallArg>) {
  return runGuiEdit((m) => {
    const b = findBlock(m, name);
    return b && (b.kind === 'part' || b.kind === 'modifier') ? fn(m.code, b) : [];
  });
}

function onCall(name: string, method: string, index: number, fn: (code: string, call: ChainCall) => ReturnType<typeof setCallArg>) {
  return onBlock(name, (code, b) => {
    const call = b.chain.filter((c) => c.method === method)[index];
    return call ? fn(code, call) : [];
  });
}

/** One control per method in the chain (S-a), plus an "Add control" menu. */
export function SoundControls({ block, hide = [] }: { block: Editable; hide?: string[] }) {
  const policy = useGuiPolicy();
  const counts = new Map<string, number>();
  const calls = block.chain.map((call) => {
    const index = counts.get(call.method) ?? 0;
    counts.set(call.method, index + 1);
    return { call, index };
  });
  const present = new Set(block.chain.map((c) => c.method));
  return (
    <div className="flex flex-col gap-1.5">
      {calls
        .filter(({ call }) => !hide.includes(call.method))
        .map(({ call, index }) => (
          <ControlRow key={`${call.method}:${index}`} block={block} call={call} index={index} />
        ))}
      <AddControl block={block} present={present} allowed={(m) => allows(policy, m) && !hide.includes(m)} />
    </div>
  );
}

/** Purple "edit this in the code" chip. */
export function CustomChip({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <Chip size="sm" className="bg-custom/15 font-mono text-custom" title={title}>
      {children}
    </Chip>
  );
}

/** A compact TipButton for block panels. */
export function SmallButton({ className, variant = 'secondary', ...rest }: ButtonProps & { tip?: string }) {
  return <TipButton size="sm" variant={variant} className={cn('h-7 min-w-0 gap-1 px-2 text-xs md:h-7', className)} {...rest} />;
}

/** A small ghost ✕ button. */
export function RemoveButton({ label, onPress, tip }: { label: string; onPress(): void; tip?: string }) {
  return (
    <SmallButton isIconOnly variant="ghost" className="w-7 px-0 text-muted md:w-7" aria-label={label} tip={tip} onPress={onPress}>
      ✕
    </SmallButton>
  );
}

const NAME = 'min-w-[108px] font-mono text-[13px]';

function ControlRow({ block, call, index }: { block: Editable; call: ChainCall; index: number }) {
  const spec = METHODS[call.method];
  const remove = () => onCall(block.name, call.method, index, (code, c) => removeCall(code, c));
  if (!spec || !call.editable) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className={NAME}>.{call.method}</span>
        <CustomChip title="Edit this in the code">custom: {call.args.map((a) => a.raw).join(', ') || '()'}</CustomChip>
      </div>
    );
  }
  const set = (v: number | string) => onCall(block.name, call.method, index, (code, c) => setCallArg(code, c, v));
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={NAME} title={spec.label}>
        .{call.method}
      </span>
      <ArgControl spec={spec} call={call} onChange={set} />
      <RemoveButton label={`Remove .${call.method}`} tip="Remove from code" onPress={remove} />
    </div>
  );
}

function ArgControl({ spec, call, onChange }: { spec: MethodSpec; call: ChainCall; onChange(v: number | string): void }) {
  const arg = call.args[0];
  if (spec.arg === 'none') return <Hint>{spec.label}</Hint>;
  if (spec.arg === 'enum' && arg?.kind === 'string') {
    const options = (spec.options ?? []).concat(spec.options?.includes(arg.value) ? [] : [arg.value]);
    return <SimpleSelect value={arg.value} onChange={onChange} aria-label={spec.label} options={options.map((o) => ({ value: o, label: o }))} />;
  }
  if (spec.arg === 'name' && arg?.kind === 'string') {
    return <NameInput spec={spec} value={arg.value} onCommit={onChange} />;
  }
  if (arg?.kind === 'number') return <NumberSlider spec={spec} value={arg.value} onChange={onChange} />;
  if (spec.arg === 'mini-number' && arg?.kind === 'string') {
    const seq = parseNumberSeq(arg.value);
    if (seq) {
      return (
        <span className="inline-flex flex-wrap items-center gap-0.5">
          {seq.values.map((v, i) => (
            <NumberSlider
              key={i}
              compact
              spec={spec}
              value={v}
              onChange={(nv) => {
                const values = [...seq.values];
                values[i] = Number(nv);
                onChange(numberSeqToMini({ ...seq, values }));
              }}
            />
          ))}
          {seq.repeat > 1 && <span className="font-mono text-xs text-muted">×{seq.repeat}</span>}
        </span>
      );
    }
    return <MiniInput value={arg.value} onCommit={(v) => onChange(v)} aria-label={spec.label} />;
  }
  return <CustomChip>custom</CustomChip>;
}

/**
 * A slider that writes on release (and on keyboard steps) so each drag is one code change.
 * Linear controls use the spec's min/max/step directly; log ones (cutoffs) slide over a
 * 0–1000 position and map it to a frequency.
 */
function NumberSlider({ spec, value, onChange, compact }: { spec: MethodSpec; value: number; onChange(v: number): void; compact?: boolean }) {
  const [draft, setDraft] = useDraft(value);
  const min = Math.min(spec.min ?? 0, value);
  const max = Math.max(spec.max ?? 1, value);
  const logMin = spec.min ?? 0;
  const toPos = (v: number) => Math.max(0, Math.min(1, Math.log(v / logMin) / Math.log(max / logMin)));
  const fromPos = (p: number) => {
    const raw = logMin * Math.pow(max / logMin, p);
    const step = raw > 1000 ? 50 : raw > 200 ? 10 : 1;
    return Math.round(raw / step) * step;
  };
  const read = (v: number | number[]) => {
    const n = Array.isArray(v) ? v[0] : v;
    return spec.log ? fromPos(n / 1000) : n;
  };
  const commit = (v: number) => v !== value && onChange(Number(formatNumber(v)));
  return (
    <span className="inline-flex items-center gap-1.5">
      <Slider
        aria-label={spec.label}
        className={cn('max-w-full', compact ? 'w-[46px]' : 'w-[150px]')}
        {...(spec.log
          ? { minValue: 0, maxValue: 1000, step: 1, value: Math.round(toPos(draft) * 1000) }
          : { minValue: min, maxValue: max, step: spec.step ?? 0.01, value: Math.max(min, Math.min(max, draft)) })}
        onChange={(v) => setDraft(read(v))}
        onChangeEnd={(v) => commit(read(v))}
      >
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
      {!compact && <span className="min-w-11 font-mono text-[13px]">{formatNumber(draft)}</span>}
    </span>
  );
}

function NameInput({ spec, value, onCommit }: { spec: MethodSpec; value: string; onCommit(v: string): void }) {
  if (spec.options) {
    const options = spec.options.includes(value) ? spec.options : [value, ...spec.options];
    return <SimpleSelect value={value} onChange={onCommit} aria-label={spec.label} options={options.map((o) => ({ value: o, label: o }))} />;
  }
  return <MiniInput value={value} onCommit={onCommit} aria-label={spec.label} />;
}

/** Free text for a string argument (mini-notation); writes on Enter or blur. */
export function MiniInput({
  value,
  onCommit,
  size = 24,
  'aria-label': ariaLabel,
}: {
  value: string;
  onCommit(v: string): void;
  size?: number;
  'aria-label'?: string;
}) {
  const [draft, setDraft] = useDraft(value);
  const commit = () => draft !== value && onCommit(draft);
  return (
    <Input
      type="text"
      aria-label={ariaLabel}
      className="max-w-full min-w-0 px-2 py-1 font-mono text-[13px] sm:text-[13px]"
      value={draft}
      size={size}
      spellCheck={false}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && commit()}
    />
  );
}

const GROUP_LABELS: Record<MethodGroup, string> = {
  sound: 'Sound',
  pitch: 'Pitch',
  level: 'Level',
  envelope: 'Envelope',
  filter: 'Filter',
  fx: 'Effects',
  space: 'Space (shared per orbit)',
  synth: 'Synth',
  time: 'Time',
};

function AddControl({ block, present, allowed }: { block: Editable; present: Set<string>; allowed(m: string): boolean }) {
  const options = Object.entries(METHODS).filter(
    ([m, spec]) => !present.has(m) && allowed(m) && spec.default !== undefined && !spec.structural && (block.kind === 'part' || m !== 's'),
  );
  if (!options.length) return null;
  const groups = [...new Set(options.map(([, s]) => s.group))];
  return (
    <SimpleSelect
      className="self-start"
      value=""
      placeholder="+ Add control…"
      aria-label="Add a control"
      onChange={(m) => m && onBlock(block.name, (code, b) => addMethod(code, b, m))}
      options={groups.map((g) => ({
        label: GROUP_LABELS[g],
        options: options.filter(([, s]) => s.group === g).map(([m, s]) => ({ value: m, label: `.${m} — ${s.label}` })),
      }))}
    />
  );
}
