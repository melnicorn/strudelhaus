'use client';

import { cn, Input, type ButtonProps } from '@heroui/react';
import type { ReactNode } from 'react';
import { Lcd } from '@/components/hw/Displays';
import type { Unit } from '@/components/hw/format';
import { HwButton, type LedColor } from '@/components/hw/HwButton';
import { Knob } from '@/components/hw/Knob';
import { Caption, SlideSwitch } from '@/components/hw/Switches';
import { SimpleSelect } from '@/components/ui/SimpleSelect';
import { TipButton } from '@/components/ui/TipButton';
import { useDraft } from '@/lib/hooks/useDraft';
import { runGuiEdit } from '@/lib/stores/model';
import { METHODS, type MethodGroup, type MethodSpec } from '@/lib/sync/allowlist';
import { addMethod, removeCall, setCallArg } from '@/lib/sync/generate';
import { formatNumber, numberSeqToMini, parseNumberSeq } from '@/lib/sync/miniGrid';
import type { ChainCall, ModifierBlock, PartBlock } from '@/lib/sync/model';
import { findBlock } from '@/lib/sync/parseProject';
import { LCD_TRIGGER } from './StepGrid';
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

const GROUP_ORDER: MethodGroup[] = ['sound', 'pitch', 'level', 'envelope', 'filter', 'fx', 'space', 'synth', 'time'];

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

/** Short section captions on the module. */
const GROUP_CAPTION: Record<MethodGroup, string> = { ...GROUP_LABELS, space: 'Space', fx: 'FX' };

/**
 * One control per method in the chain (S-a), laid out like a synth module: sections per
 * group, knobs for numbers, switches for short choices, LCDs for names. Plus "+" to add one.
 */
export function SoundControls({ block, hide = [] }: { block: Editable; hide?: string[] }) {
  const policy = useGuiPolicy();
  const counts = new Map<string, number>();
  const calls = block.chain
    .map((call) => {
      const index = counts.get(call.method) ?? 0;
      counts.set(call.method, index + 1);
      return { call, index };
    })
    .filter(({ call }) => !hide.includes(call.method));
  const present = new Set(block.chain.map((c) => c.method));
  const groups = GROUP_ORDER.filter((g) => calls.some(({ call }) => (METHODS[call.method]?.group ?? 'time') === g));
  const unknown = calls.filter(({ call }) => !METHODS[call.method]);
  return (
    <div className="flex flex-wrap items-stretch gap-x-4 gap-y-3 border-t border-hw-line pt-2.5">
      {groups.map((g) => (
        <Section key={g} caption={GROUP_CAPTION[g]} title={GROUP_LABELS[g]}>
          {calls
            .filter(({ call }) => METHODS[call.method]?.group === g)
            .map(({ call, index }) => (
              <Control key={`${call.method}:${index}`} block={block} call={call} index={index} />
            ))}
        </Section>
      ))}
      {unknown.length > 0 && (
        <Section caption="Code" title="Written by hand: edit it in the code">
          {unknown.map(({ call, index }) => (
            <Control key={`${call.method}:${index}`} block={block} call={call} index={index} />
          ))}
        </Section>
      )}
      <AddControl block={block} present={present} allowed={(m) => allows(policy, m) && !hide.includes(m)} />
    </div>
  );
}

/** A labelled section of a module: a vertical caption on the left, controls to its right. */
function Section({ caption, title, children }: { caption: string; title?: string; children: ReactNode }) {
  return (
    <div className="flex items-end gap-2.5 border-r border-hw-line pr-4 last:border-r-0 last:pr-0">
      <span className="self-center text-[9px] tracking-[0.1em] text-hw-muted uppercase [writing-mode:vertical-rl] rotate-180" title={title}>
        {caption}
      </span>
      <div className="flex flex-wrap items-end gap-2.5">{children}</div>
    </div>
  );
}

/** Purple "edit this in the code" LCD. */
export function CustomChip({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <Lcd tone="purple" title={title} className="max-w-56">
      {children}
    </Lcd>
  );
}

/** A compact hardware button for block panels. `variant="primary"` lights the label amber. */
export function SmallButton({ className, variant, ...rest }: Omit<ButtonProps, 'children' | 'size'> & { children?: ReactNode; tip?: string; led?: LedColor }) {
  return <HwButton size="sm" className={cn(variant === 'primary' && 'text-led', className)} {...rest} />;
}

/** A small ghost ✕ button. */
export function RemoveButton({ label, onPress, tip, className }: { label: string; onPress(): void; tip?: string; className?: string }) {
  return (
    <TipButton
      isIconOnly
      size="sm"
      variant="ghost"
      className={cn('h-5 min-w-0 w-5 px-0 text-[11px] text-hw-muted hover:text-hw-ink md:h-5 md:w-5', className)}
      aria-label={label}
      tip={tip}
      onPress={onPress}
    >
      ✕
    </TipButton>
  );
}

/** How a method's number reads on its knob. */
function unitOf(method: string, spec: MethodSpec): Unit {
  if (spec.log) return 'hz';
  if (method === 'pan') return 'pan';
  if (/attack|decay|release/.test(method)) return 'seconds';
  if ((spec.min ?? 0) < 0) return 'signed';
  if (spec.step === 1) return 'int';
  return 'number';
}

/** One control with its remove ✕ (shown on hover or focus). */
function Control({ block, call, index }: { block: Editable; call: ChainCall; index: number }) {
  const spec = METHODS[call.method];
  const remove = () => onCall(block.name, call.method, index, (code, c) => removeCall(code, c));
  if (!spec || !call.editable) {
    return (
      <div className="flex flex-col items-center gap-1">
        <CustomChip title="Edit this in the code">
          .{call.method}({call.args.map((a) => a.raw).join(', ')})
        </CustomChip>
        <Caption>custom</Caption>
      </div>
    );
  }
  const set = (v: number | string) => onCall(block.name, call.method, index, (code, c) => setCallArg(code, c, v));
  return (
    <div className="group relative flex flex-col items-center gap-1">
      <RemoveButton
        label={`Remove .${call.method}`}
        tip="Remove from code"
        onPress={remove}
        className="absolute -top-1.5 -right-2 z-10 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
      />
      <ArgControl method={call.method} spec={spec} call={call} onChange={set} />
    </div>
  );
}

function ArgControl({ method, spec, call, onChange }: { method: string; spec: MethodSpec; call: ChainCall; onChange(v: number | string): void }) {
  const arg = call.args[0];
  const caption = <span title={spec.label}>{method}</span>;
  if (spec.arg === 'none') {
    return (
      <>
        <Lcd title={spec.label}>.{method}()</Lcd>
        <Caption>{caption}</Caption>
      </>
    );
  }
  if (spec.arg === 'enum' && arg?.kind === 'string') {
    const options = (spec.options ?? []).concat(spec.options?.includes(arg.value) ? [] : [arg.value]);
    if (options.length <= 5) return <SlideSwitch label={spec.label} value={arg.value} options={options} onChange={onChange} caption={caption} />;
    return (
      <>
        <SimpleSelect value={arg.value} onChange={onChange} aria-label={spec.label} triggerClassName={LCD_TRIGGER} options={options.map((o) => ({ value: o, label: o }))} />
        <Caption>{caption}</Caption>
      </>
    );
  }
  if (spec.arg === 'name' && arg?.kind === 'string') {
    return (
      <>
        <NameInput spec={spec} value={arg.value} onCommit={onChange} />
        <Caption>{caption}</Caption>
      </>
    );
  }
  if (arg?.kind === 'number') return <NumberKnob method={method} spec={spec} value={arg.value} onChange={onChange} caption={caption} />;
  if (spec.arg === 'mini-number' && arg?.kind === 'string') {
    const seq = parseNumberSeq(arg.value);
    if (seq) {
      // A pattern of numbers: one small knob per value, so each step's level or cutoff is its own knob.
      return (
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-end gap-1">
            {seq.values.map((v, i) => (
              <NumberKnob
                key={i}
                size="sm"
                method={method}
                spec={spec}
                value={v}
                caption={String(i + 1)}
                onChange={(nv) => {
                  const values = [...seq.values];
                  values[i] = Number(nv);
                  onChange(numberSeqToMini({ ...seq, values }));
                }}
              />
            ))}
            {seq.repeat > 1 && <span className="pb-5 font-mono text-xs text-hw-muted">×{seq.repeat}</span>}
          </div>
          <Caption>{caption}</Caption>
        </div>
      );
    }
    return (
      <>
        <MiniInput value={arg.value} onCommit={(v) => onChange(v)} aria-label={spec.label} />
        <Caption>{caption}</Caption>
      </>
    );
  }
  return <CustomChip>custom</CustomChip>;
}

/** A knob for a numeric argument; writes on release, keyboard step or a typed value. */
function NumberKnob({ method, spec, value, onChange, caption, size }: { method: string; spec: MethodSpec; value: number; onChange(v: number): void; caption: ReactNode; size?: 'sm' | 'md' }) {
  const min = Math.min(spec.min ?? 0, value);
  const max = Math.max(spec.max ?? 1, value);
  return (
    <Knob
      label={spec.label}
      caption={caption}
      size={size}
      value={value}
      min={min}
      max={max}
      step={spec.step}
      log={spec.log}
      bipolar={method === 'pan' || min < 0}
      defaultValue={typeof spec.default === 'number' ? spec.default : undefined}
      unit={unitOf(method, spec)}
      onChange={(v) => onChange(Number(formatNumber(v)))}
    />
  );
}

function NameInput({ spec, value, onCommit }: { spec: MethodSpec; value: string; onCommit(v: string): void }) {
  if (spec.options) {
    const options = spec.options.includes(value) ? spec.options : [value, ...spec.options];
    return <SimpleSelect value={value} onChange={onCommit} aria-label={spec.label} triggerClassName={LCD_TRIGGER} options={options.map((o) => ({ value: o, label: o }))} />;
  }
  return <MiniInput value={value} onCommit={onCommit} aria-label={spec.label} />;
}

/** Free text for a string argument (mini-notation) on an LCD; writes on Enter or blur. */
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
      className="hw-lcd max-w-full min-w-0 px-2 py-1 font-mono text-[12px] text-lcd-ink sm:text-[12px]"
      value={draft}
      size={size}
      spellCheck={false}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && commit()}
    />
  );
}

function AddControl({ block, present, allowed }: { block: Editable; present: Set<string>; allowed(m: string): boolean }) {
  const options = Object.entries(METHODS).filter(
    ([m, spec]) => !present.has(m) && allowed(m) && spec.default !== undefined && !spec.structural && (block.kind === 'part' || m !== 's'),
  );
  if (!options.length) return null;
  const groups = [...new Set(options.map(([, s]) => s.group))];
  return (
    <Section caption="Add" title="Add a control (writes a method to the code)">
      <div className="flex flex-col items-center gap-1">
        <SimpleSelect
          value=""
          placeholder="+"
          aria-label="Add a control"
          triggerClassName={cn(LCD_TRIGGER, 'min-w-11 justify-center text-sm')}
          onChange={(m) => m && onBlock(block.name, (code, b) => addMethod(code, b, m))}
          options={groups.map((g) => ({
            label: GROUP_LABELS[g],
            options: options.filter(([, s]) => s.group === g).map(([m, s]) => ({ value: m, label: `.${m} — ${s.label}` })),
          }))}
        />
        <Caption>control</Caption>
      </div>
    </Section>
  );
}
