'use client';

import { Button, cn, SearchField, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { TipButton } from '@/components/ui/TipButton';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_MACHINE, DRUM_NAMES, MACHINES, SYNTHS, type Machine, type Synth } from '@/lib/sounds/catalog';
import { addPartToCode, partNameFor } from '@/lib/sounds/insert';
import { useLibraryStore } from '@/lib/stores/library';
import { withTerms } from '@/components/lesson/Prose';
import { Hint } from '@/components/ui/Hint';
import { Panel } from '@/components/ui/Panel';
import { drumCode, machineDemo, MachineSounds, SynthKeys, useAudition } from './parts';

type Filter = 'classic' | 'all' | 'drums' | 'synths';
/** Start on the machine most 90s house and techno was made with. */
const START = MACHINES.find((m) => m.bank === 'RolandTR909') ?? MACHINES[0];

type Selection = { kind: 'machine'; machine: Machine } | { kind: 'synth'; synth: Synth };

const FILTERS: [Filter, string][] = [
  ['classic', '★ 90s house & techno'],
  ['all', 'All'],
  ['drums', 'Drum machines'],
  ['synths', 'Synths & keys'],
];

/** The /sounds page: pick a machine or synth, click to hear it, see the code. */
export function SoundsView() {
  const [filter, setFilter] = useState<Filter>('classic');
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState<Selection>({ kind: 'machine', machine: START });
  const [picked, setPicked] = useState<{ sound: string; n: number } | null>(null);
  const [code, setCode] = useState(drumCode(START.bank, 'bd'));
  const [bars, setBars] = useState(1);
  const [flash, setFlash] = useState(0);
  const { play, error } = useAudition();

  const show = (c: string, length = 1) => {
    setCode(c);
    setBars(length);
    setFlash((f) => f + 1);
    void play(c, length);
  };

  const q = query.trim().toLowerCase();
  const machines = useMemo(() => {
    if (filter === 'synths') return [];
    const all = [...MACHINES, DEFAULT_MACHINE];
    return all.filter(
      (m) =>
        (filter !== 'classic' || m.classic) &&
        (!q ||
          m.name.toLowerCase().includes(q) ||
          m.bank.toLowerCase().includes(q) ||
          m.sounds.some(([s]) => s === q || DRUM_NAMES[s]?.includes(q))),
    );
  }, [filter, q]);
  const synths = filter === 'drums' ? [] : SYNTHS.filter((s) => !q || s.sound.includes(q) || s.blurb.toLowerCase().includes(q));

  const select = (s: Selection) => {
    setSel(s);
    setPicked(null);
    setCode(s.kind === 'machine' ? drumCode(s.machine.bank, s.machine.sounds[0]?.[0] ?? 'bd') : `note("c3").s("${s.synth.sound}")`);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <ToggleButtonGroup
          aria-label="Filter sounds"
          size="sm"
          isDetached
          className="flex-wrap gap-1.5"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={new Set([filter])}
          onSelectionChange={(keys) => {
            const [k] = keys;
            if (k) setFilter(k as Filter);
          }}
        >
          {FILTERS.map(([f, label]) => (
            <ToggleButton key={f} id={f}>
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <SearchField
          aria-label="Search sounds"
          value={query}
          onChange={setQuery}
          className="ml-auto w-[220px] max-w-full max-[760px]:ml-0 max-[760px]:w-full"
        >
          <SearchField.Group className="w-full">
            <SearchField.SearchIcon />
            <SearchField.Input className="min-w-0" placeholder="Search: 909, clap, saw…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>

      <div className="grid grid-cols-[250px_minmax(0,1fr)] items-start gap-3 max-[760px]:grid-cols-1">
        <nav
          className="sticky top-3 flex max-h-[calc(100cqh-130px)] min-w-0 flex-col overflow-y-auto rounded-lg border border-border bg-surface p-2 max-[760px]:static max-[760px]:max-h-[220px]"
          aria-label="Machines and synths"
        >
          {machines.length > 0 && <GroupLabel>Drum machines</GroupLabel>}
          {machines.map((m) => (
            <SourceRow
              key={m.bank || 'default'}
              selected={sel.kind === 'machine' && sel.machine === m}
              onPress={() => select({ kind: 'machine', machine: m })}
            >
              <span>
                {m.classic && m.bank && <span className="text-accent">★ </span>}
                {m.name}
              </span>
              <Meta>{m.year ?? (m.bank ? '' : 'no bank')}</Meta>
            </SourceRow>
          ))}
          {filter === 'classic' && !q && (
            <SourceRow className="text-[13px] text-muted" onPress={() => setFilter('all')}>
              + {MACHINES.length - machines.length + 1} more machines
            </SourceRow>
          )}
          {synths.length > 0 && <GroupLabel>Synths, noise &amp; keys</GroupLabel>}
          {synths.map((s) => (
            <SourceRow key={s.sound} selected={sel.kind === 'synth' && sel.synth === s} onPress={() => select({ kind: 'synth', synth: s })}>
              <span className="font-mono">{s.sound}</span>
              <Meta>{s.kind === 'synth' ? '' : s.kind}</Meta>
            </SourceRow>
          ))}
          {!machines.length && !synths.length && <Hint className="px-1.5">Nothing matches “{query}”.</Hint>}
        </nav>

        <div className="min-w-0">
          <Panel>
            {sel.kind === 'machine' ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="m-0 text-lg font-semibold">
                      {sel.machine.name} {sel.machine.year && <Meta>{sel.machine.year}</Meta>}
                    </h2>
                    {sel.machine.blurb && <Blurb>{withTerms(sel.machine.blurb)}</Blurb>}
                  </div>
                  <Button variant="primary" onPress={() => show(machineDemo(sel.machine), 2)}>
                    ▶ Play a beat
                  </Button>
                </div>
                <Hint>
                  {sel.machine.bank ? (
                    <>
                      Choose this machine with <code>.bank(&quot;{sel.machine.bank}&quot;)</code>.{' '}
                    </>
                  ) : (
                    <>These play when a part has no <code>.bank()</code>. </>
                  )}
                  The numbers are variants: <code>bd:1</code> is the second kick (the same as <code>.n(1)</code>).
                </Hint>
                <MachineSounds
                  machine={sel.machine}
                  selected={picked}
                  onPick={(sound, n) => {
                    setPicked({ sound, n });
                    show(drumCode(sel.machine.bank, sound, n));
                  }}
                />
              </>
            ) : (
              <>
                <div>
                  <h2 className="m-0 font-mono text-lg font-semibold">{sel.synth.sound}</h2>
                  <Blurb>{withTerms(sel.synth.blurb)}</Blurb>
                </div>
                {sel.synth.kind === 'noise' ? (
                  <Button variant="primary" className="self-start" onPress={() => show(`s("${sel.synth.sound} ~ ~ ~")`)}>
                    ▶ Play
                  </Button>
                ) : (
                  <SynthKeys key={sel.synth.sound} synth={sel.synth} onPlay={show} />
                )}
              </>
            )}
          </Panel>
          <CodeBar code={code} flash={flash} error={error} onReplay={() => void play(code, bars)} />
        </div>
      </div>
    </div>
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return <div className="mx-1.5 mt-2.5 mb-1 text-[11px] tracking-wide text-muted uppercase first:mt-0.5">{children}</div>;
}

function Meta({ children }: { children: ReactNode }) {
  return <span className="text-xs font-normal text-muted">{children}</span>;
}

function Blurb({ children }: { children: ReactNode }) {
  return <p className="mt-0.5 mb-0 text-muted">{children}</p>;
}

/** One selectable machine or synth in the source list. */
function SourceRow({
  selected,
  onPress,
  className,
  children,
}: {
  selected?: boolean;
  onPress(): void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      onPress={onPress}
      className={cn(
        'h-auto min-h-0 w-full shrink-0 justify-between gap-1.5 rounded px-2 py-1 text-left text-sm font-normal whitespace-normal text-foreground',
        selected && 'bg-accent/20 hover:bg-accent/20',
        className,
      )}
    >
      {children}
    </Button>
  );
}

function CodeBar({ code, flash, error, onReplay }: { code: string; flash: number; error: string | null; onReplay(): void }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const addToSandbox = () => {
    const store = useLibraryStore.getState();
    if (!store.loaded) store.load();
    const project = useLibraryStore.getState().current() ?? useLibraryStore.getState().createProject('My track', 'setcpm(124/4)\n');
    const sound = /s\("([^"]+)"\)/.exec(code)?.[1] ?? 'sound';
    const { code: next } = addPartToCode(project.code, partNameFor(sound.split(/[ ,*~[\]]/).find(Boolean) ?? 'sound'), code);
    useLibraryStore.getState().saveCode(next);
    router.push('/sandbox');
  };

  return (
    // `dark` gives the buttons and error text their dark-theme colours on the always-dark bar.
    <div
      className="dark sticky bottom-2 mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-code px-3 py-2.5 text-code-foreground shadow-lg"
      aria-live="polite"
    >
      <code key={flash} className="min-w-[200px] flex-1 animate-flash overflow-x-auto rounded-sm text-sm whitespace-pre max-[760px]:min-w-0 max-[760px]:basis-full">
        {code}
      </code>
      <Button size="sm" variant="secondary" onPress={onReplay}>
        ▶ again
      </Button>
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
      <TipButton size="sm" variant="secondary" onPress={addToSandbox} tip="Adds this as a new part in your current sandbox project">
        Add to sandbox ↗
      </TipButton>
      {error && <span className="basis-full text-[13px] text-danger">{error}</span>}
    </div>
  );
}
