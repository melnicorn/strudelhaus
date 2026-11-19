'use client';

import { Button, cn } from '@heroui/react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';
import { HW_SURFACE } from '@/components/hw/Displays';
import { Knob } from '@/components/hw/Knob';
import { ToggleSwitch } from '@/components/hw/Switches';
import { withTerms } from '@/components/lesson/Prose';
import { Hint } from '@/components/ui/Hint';
import { linkClass } from '@/components/ui/Page';
import { Panel } from '@/components/ui/Panel';
import { TipButton } from '@/components/ui/TipButton';
import { formatValue } from '@/components/hw/format';
import { addPartToCode } from '@/lib/sounds/insert';
import { useLibraryStore } from '@/lib/stores/library';
import { useStylesStore } from '@/lib/stores/styles';
import { applyVariation, buildCode, defaultState, soundLines, statuses, strippedState, verdict, type CodeLine, type IngredientStatus } from '@/lib/styles/build';
import { GROUPS, type Ingredient, type Knob as KnobSpec, type Sound, type SoundState, type Style } from '@/lib/styles/types';
import { usePlayer } from './usePlayer';

const chip = 'rounded-full border border-border bg-surface-secondary px-2 py-px text-[11px] whitespace-nowrap';
const unitOf = (k: KnobSpec) => k.unit ?? 'number';

/** One style: its signature sounds, and the selected one taken apart into switchable steps. */
export function StyleView({ style, soundId }: { style: Style; soundId: string }) {
  const sound = style.sounds.find((s) => s.id === soundId) ?? style.sounds[0];
  const key = `${style.id}/${sound.id}`;
  const stored = useStylesStore((s) => s.states[key]);
  const setStored = useStylesStore((s) => s.setState);
  const inContext = useStylesStore((s) => s.inContext);
  const setInContext = useStylesStore((s) => s.setInContext);
  const state = useMemo(() => stored ?? defaultState(sound), [stored, sound]);
  // The step last touched, so its line in the code can be pointed out.
  const [touched, setTouched] = useState<{ key: string; id: string; n: number } | null>(null);
  const update = (next: SoundState, id?: string) => {
    setStored(key, next);
    setTouched(id ? { key, id, n: (touched?.n ?? 0) + 1 } : null);
  };

  const { lines, code } = buildCode(style, sound, state, inContext);
  const { playing, toggle, error } = usePlayer(code);
  const status = statuses(sound, state);
  const nextOff = sound.ingredients.find((i) => !state.on[i.id] && !i.required);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Link href="/styles" className={cn(linkClass, 'text-muted')}>
          ← Styles
        </Link>
        <h1 className="m-0 text-[1.75rem] leading-tight font-bold">{style.name}</h1>
        <span className={chip}>{style.era}</span>
        <span className={chip}>{style.tempo} BPM</span>
        <span className={chip}>{style.key}</span>
        <span className="flex-1" />
        <TipButton
          variant={inContext ? 'primary' : 'secondary'}
          aria-pressed={inContext}
          onPress={() => setInContext(!inContext)}
          tip="Play the sound over this style's backing loop, or alone"
        >
          In context: {inContext ? 'on' : 'off'}
        </TipButton>
        <Button variant="primary" onPress={toggle} className="min-w-24">
          {playing ? '■ Stop' : '▶ Play'}
        </Button>
      </div>

      <div className="grid grid-cols-[210px_minmax(0,1fr)_minmax(0,420px)] items-start gap-3 max-[1100px]:grid-cols-[210px_minmax(0,1fr)] max-[760px]:grid-cols-1">
        <Panel title={`${style.sounds.length} sounds`} className="sticky top-3 max-[760px]:static">
          <nav className="flex flex-col gap-1" aria-label={`${style.name} sounds`}>
            {GROUPS.filter((g) => style.sounds.some((s) => s.group === g.id)).map((g) => (
              <div key={g.id} className="flex flex-col gap-0.5">
                <h3 className="m-0 mt-1.5 px-2 text-[10px] font-semibold tracking-[0.08em] text-muted uppercase">{g.label}</h3>
                {style.sounds
                  .filter((s) => s.group === g.id)
                  .map((s) => (
                    <Link
                      key={s.id}
                      href={`/styles/${style.id}/${s.id}` as Route}
                      aria-current={s.id === sound.id ? 'page' : undefined}
                      className={cn('flex flex-col rounded px-2 py-1 hover:bg-surface-secondary', s.id === sound.id && 'bg-accent/20 hover:bg-accent/20')}
                    >
                      <span>{s.name}</span>
                      <span className="text-[11px] text-muted">
                        {s.role} · {s.ingredients.length} steps
                      </span>
                    </Link>
                  ))}
              </div>
            ))}
          </nav>
        </Panel>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="m-0 text-lg font-semibold">{sound.name}</h2>
            <span className={cn(chip, 'border-custom text-custom')}>{sound.role}</span>
          </div>
          <p className="mt-1.5 mb-3 max-w-[70ch] text-[15px]">{withTerms(sound.why)}</p>

          <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
            <TipButton size="sm" variant="secondary" onPress={() => update(strippedState(sound, state))} tip="Switch every step off, then add them back one at a time">
              Build from scratch
            </TipButton>
            <Button size="sm" variant="secondary" isDisabled={!nextOff} onPress={() => nextOff && update({ ...state, on: { ...state.on, [nextOff.id]: true } }, nextOff.id)}>
              {nextOff ? `Add: ${nextOff.name} ▸` : 'Every step is on'}
            </Button>
            <span className="flex-1" />
            {sound.variations.map((v) => (
              <TipButton key={v.name} size="sm" variant="secondary" onPress={() => update(applyVariation(sound, v))} tip="A named tuning of this sound">
                {v.name}
              </TipButton>
            ))}
            <Button size="sm" variant="ghost" onPress={() => update(defaultState(sound))}>
              Reset
            </Button>
          </div>

          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {sound.ingredients.map((ing, n) => (
              <Step
                key={ing.id}
                number={n + 1}
                ingredient={ing}
                status={status[ing.id]}
                needs={ing.needs ? sound.ingredients.findIndex((i) => i.id === ing.needs) + 1 : 0}
                state={state}
                onToggle={(on) => update({ ...state, on: { ...state.on, [ing.id]: on } }, ing.id)}
                onKnob={(param, value) => update({ ...state, vals: { ...state.vals, [param]: value } }, ing.id)}
              />
            ))}
          </ol>
          <Hint className="mt-2">Switch any step off to hear what it was doing. Drag a knob up or down; the green band is where it sounds right for {style.name.toLowerCase()}.</Hint>
        </div>

        <div className="sticky top-3 flex min-w-0 flex-col gap-3 max-[1100px]:static max-[1100px]:col-span-full">
          <Panel title="The code this makes">
            <CodeBlock lines={lines} touched={touched?.key === key ? touched : null} />
            {error && (
              <div className="rounded-lg border border-danger bg-danger/10 p-2 text-xs" role="alert">
                <b>{error.title}</b>
                {error.detail && error.detail !== error.title && <div className="mt-1 font-mono whitespace-pre-wrap text-muted">{error.detail}</div>}
              </div>
            )}
            <CodeActions code={code} sound={sound} state={state} />
          </Panel>
          {sound.pitfalls.length > 0 && (
            <Panel title="Common mistakes">
              <ul className="m-0 flex list-disc flex-col gap-1 pl-5">
                {sound.pitfalls.map((p) => (
                  <li key={p}>{withTerms(p)}</li>
                ))}
              </ul>
            </Panel>
          )}
          {sound.lessons.length > 0 && (
            <Panel title="Learn the pieces">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {sound.lessons.map((l) => (
                  <Link key={l.id} href={`/learn/${l.id}` as Route} className={linkClass}>
                    {l.number}. {l.title}
                  </Link>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

interface StepProps {
  number: number;
  ingredient: Ingredient;
  status: IngredientStatus;
  /** The number of the step this one needs, or 0. */
  needs: number;
  state: SoundState;
  onToggle(on: boolean): void;
  onKnob(param: string, value: number): void;
}

/** One ingredient: its switch, what it adds, and its knobs while it is on. */
function Step({ number, ingredient: ing, status, needs, state, onToggle, onKnob }: StepProps) {
  const live = status === 'on';
  const slice = (ing.pattern ?? ing.code ?? ing.layer ?? '').replace(/\{\w+\}/g, '…');
  return (
    <li
      className={cn(
        'grid grid-cols-[36px_minmax(0,1fr)] gap-2.5 rounded-lg border border-border bg-surface p-2.5',
        !live && 'border-dashed bg-transparent',
        (status === 'off' || status === 'blocked') && 'opacity-60',
      )}
    >
      <div className="dark">
        <ToggleSwitch label={ing.name} caption={number} isOn={status !== 'off' && status !== 'blocked'} isDisabled={ing.required || status === 'blocked'} onChange={onToggle} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <b>{ing.name}</b>
          {ing.required && <span className={chip}>starting point</span>}
          {status === 'replaced' && <span className={chip}>replaced by a later step</span>}
          {status === 'blocked' && <span className={chip}>needs step {needs}</span>}
          {ing.layer && <span className={chip}>a part of its own</span>}
          <span className="flex-1" />
          {slice && <code className="min-w-0 truncate text-xs text-muted">{slice}</code>}
        </div>
        <div>{withTerms(ing.adds)}</div>
        {ing.listenFor && (
          <Hint>
            <b className="text-foreground">Listen for:</b> {ing.listenFor}
          </Hint>
        )}
        {live && ing.knobs.length > 0 && (
          <div className={cn(HW_SURFACE, 'mt-2 flex flex-wrap gap-x-6 gap-y-3 px-3 py-2.5')}>
            {ing.knobs.map((k) => (
              <KnobRow key={k.param} knob={k} value={state.vals[k.param]} onChange={(v) => onKnob(k.param, v)} />
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

/** A knob with its sweet spot, and what is wrong when it sits outside it. */
function KnobRow({ knob: k, value, onChange }: { knob: KnobSpec; value: number; onChange(v: number): void }) {
  const where = verdict(k, value);
  const unit = unitOf(k);
  return (
    <div className="flex min-w-[220px] flex-1 items-center gap-3">
      <Knob
        label={k.label ?? k.param}
        value={value}
        onChange={onChange}
        min={k.min}
        max={k.max}
        step={k.step ?? (unit === 'int' ? 1 : undefined)}
        log={k.log}
        unit={unit}
        defaultValue={k.value}
        sweet={k.sweet}
      />
      <div className="min-w-0 text-xs text-hw-muted" aria-live="polite">
        <b className={cn('block text-[10px] tracking-[0.08em] uppercase', where === 'in' ? 'text-go' : 'text-led')}>
          {where === 'in' ? 'In the sweet spot' : where === 'below' ? 'Too low' : 'Too high'}
        </b>
        {where === 'in' ? (
          <span className="font-mono">
            {formatValue(k.sweet[0], unit)} – {formatValue(k.sweet[1], unit)}
          </span>
        ) : (
          k[where]
        )}
      </div>
    </div>
  );
}

const TOKEN = /("[^"]*")|(\.[A-Za-z]+|\b(?:note|s|stack|setcpm)(?=\())|(\b\d*\.?\d+\b)/g;

function highlight(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <span key={m.index} className={m[1] ? 'text-[#ce9178]' : m[2] ? 'text-[#dcdcaa]' : 'text-[#b5cea8]'}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  out.push(text.slice(last));
  return out;
}

/** The generated program, one line per step that is on; the step last touched flashes. */
function CodeBlock({ lines, touched }: { lines: CodeLine[]; touched: { id: string; n: number } | null }) {
  return (
    <pre className="m-0 overflow-x-auto rounded-lg bg-code py-2.5 font-mono text-[12.5px] leading-relaxed text-code-foreground" aria-label="Generated Strudel code">
      {lines.map((l, i) => {
        const hit = !!touched && l.ingredient === touched.id;
        return (
          <div key={hit ? `${i}-${touched.n}` : i} className={cn('flex pr-3', hit && 'animate-flash')}>
            <span className="w-8 flex-none pr-2.5 text-right text-[#6e6e6e] select-none">{i + 1}</span>
            <span>{highlight(l.text)}</span>
          </div>
        );
      })}
    </pre>
  );
}

function CodeActions({ code, sound, state }: { code: string; sound: Sound; state: SoundState }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const addToSandbox = () => {
    const store = useLibraryStore.getState();
    if (!store.loaded) store.load();
    const project = useLibraryStore.getState().current() ?? useLibraryStore.getState().createProject('My track', 'setcpm(124/4)\n');
    const name = sound.id.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
    const expr = soundLines(sound, state)
      .map((l) => l.text)
      .join('\n');
    useLibraryStore.getState().saveCode(addPartToCode(project.code, name, expr).code);
    router.push('/sandbox');
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          void navigator.clipboard?.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </Button>
      <TipButton size="sm" variant="secondary" onPress={addToSandbox} tip="Adds this sound, as it is tuned now, as a new part in your current sandbox project">
        Add to sandbox ↗
      </TipButton>
    </div>
  );
}
