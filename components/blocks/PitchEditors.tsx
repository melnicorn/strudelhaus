'use client';

import { cn } from '@heroui/react';
import { useEffect, useState } from 'react';
import { Hint } from '@/components/ui/Hint';
import { evaluatePure, onsets } from '@/lib/strudel/pure';
import { runGuiEdit } from '@/lib/stores/model';
import { setControl, setRootArg } from '@/lib/sync/generate';
import { gridToMini, numberSeqToMini, parseGrid, parseNumberSeq, type Steps } from '@/lib/sync/miniGrid';
import type { PartBlock, ProjectModel } from '@/lib/sync/model';
import { compactSequence, expandTo, noteRange, slideAmounts } from '@/lib/sync/notes';
import { findBlock } from '@/lib/sync/parseProject';
import { usePlayStep } from './StepGrid';
import { MiniInput, RemoveButton, SmallButton } from './SoundControls';
import { soloCode } from './usePreview';
import { writeRoot } from './DrumEditor';

const NOTES = noteRange(24, 60);

const LABEL = 'text-muted';
const CELL = 'h-[22px] cursor-pointer rounded-[3px] border p-0 text-[11px]';

/** Reads a mini-number control as 16 per-step values (or null if it can't be). */
function stepValues(part: PartBlock, method: string, fallback: number): number[] | null {
  const call = part.chain.find((c) => c.method === method);
  if (!call) return Array(16).fill(fallback);
  const a = call.args[0];
  if (a?.kind === 'number') return Array(16).fill(a.value);
  if (a?.kind !== 'string') return null;
  const seq = parseNumberSeq(a.value);
  return seq ? expandTo(seq.values, seq.repeat) : null;
}

/** 16 values → the shortest code: a plain number if all equal, else "[…]*n" or a list. */
function seqValue(values: number[]): number | string {
  const c = compactSequence(values);
  return c.values.length === 1 ? c.values[0] : numberSeqToMini(c);
}

/** 303-style step sequencer (P-a): note, accent and ≈slide per step. */
export function AcidSequencer({ part }: { part: PartBlock }) {
  const now = usePlayStep();
  const notes = part.root.arg.kind === 'string' ? parseGrid(part.root.arg.value) : null;
  const velocity = stepValues(part, 'velocity', 0.6);
  const penv = stepValues(part, 'penv', 0);
  if (!notes || !velocity || !penv) return null;
  const accents = velocity.map((v) => v >= 0.9);
  const slides = penv.map((v) => v !== 0);

  const write = (nextNotes: Steps, nextAccents: boolean[], nextSlides: boolean[]) =>
    runGuiEdit((m) => {
      const b = findBlock(m, part.name);
      if (b?.kind !== 'part') return [];
      const edits = [];
      if (nextNotes !== notes) edits.push(...setRootArg(m.code, b, gridToMini(nextNotes)));
      if (nextAccents !== accents) {
        edits.push(...setControl(m.code, b, 'velocity', seqValue(nextAccents.map((a) => (a ? 1 : 0.6)))));
        edits.push(...setControl(m.code, b, 'lpenv', seqValue(nextAccents.map((a) => (a ? 6 : 3)))));
      }
      if (nextSlides !== slides || nextNotes !== notes) {
        const amounts = slideAmounts(nextNotes, nextSlides);
        if (nextSlides.some(Boolean) || b.chain.some((c) => c.method === 'penv')) {
          edits.push(...setControl(m.code, b, 'penv', seqValue(amounts)));
          if (!b.chain.some((c) => c.method === 'pattack')) edits.push(...setControl(m.code, b, 'pattack', 0.06));
        }
      }
      return edits;
    });

  return (
    <div className="grid grid-cols-[56px_repeat(16,minmax(30px,1fr))] items-center gap-[3px] overflow-x-auto text-xs" role="grid" aria-label={`${part.name} sequencer`}>
      <span className={LABEL}>step</span>
      {notes.map((_, i) => (
        <span key={i} className={cn('rounded-[3px] text-center text-muted', i % 4 === 0 && 'font-bold', now === i && 'bg-success/15 text-foreground')}>
          {i + 1}
        </span>
      ))}
      <span className={LABEL}>note</span>
      {notes.map((n, i) => (
        <select
          key={i}
          className="w-full min-w-0 cursor-pointer appearance-none rounded border border-border bg-surface px-0 py-0.5 text-center font-mono text-[11px] text-foreground"
          value={n ?? '~'}
          aria-label={`note ${i + 1}`}
          onChange={(e) => {
            const next = [...notes];
            next[i] = e.target.value === '~' ? null : e.target.value;
            write(next, accents, slides);
          }}
        >
          <option value="~">—</option>
          {(n && !NOTES.includes(n) ? [n, ...NOTES] : NOTES).map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      ))}
      <span className={LABEL} title="Louder and brighter: writes .velocity and .lpenv">
        accent
      </span>
      {accents.map((a, i) => (
        <button
          key={i}
          className={cn(CELL, a ? 'border-accent bg-accent text-accent-foreground' : 'border-border bg-default')}
          aria-pressed={a}
          aria-label={`accent ${i + 1}`}
          onClick={() => write(notes, accents.map((x, j) => (j === i ? !x : x)), slides)}
        >
          {a ? 'A' : ''}
        </button>
      ))}
      <span className={LABEL} title="Strudel has no real slide; this bends up from the previous note with .penv">
        ≈ slide
      </span>
      {slides.map((s, i) => (
        <button
          key={i}
          className={cn(CELL, s ? 'border-custom bg-custom text-custom-foreground' : 'border-border bg-default')}
          aria-pressed={s}
          aria-label={`slide ${i + 1}`}
          onClick={() => write(notes, accents, slides.map((x, j) => (j === i ? !x : x)))}
        >
          {s ? 'S' : ''}
        </button>
      ))}
    </div>
  );
}

/** Scale-degree tracker (P-c): one number per step, notes come from the scale. */
export function DegreeTracker({ part }: { part: PartBlock }) {
  const steps = part.root.arg.kind === 'string' ? parseGrid(part.root.arg.value) : null;
  if (!steps) return null;
  return (
    <div className="flex flex-wrap gap-2.5">
      {[0, 1, 2, 3].map((beat) => (
        <span className="inline-flex gap-0.5" key={beat}>
          {steps.slice(beat * 4, beat * 4 + 4).map((s, k) => {
            const i = beat * 4 + k;
            return (
              <input
                key={i}
                type="text"
                className="w-[30px] rounded border border-border bg-surface px-0 py-[3px] text-center font-mono text-[13px] text-foreground"
                defaultValue={s ?? ''}
                placeholder="·"
                aria-label={`degree at step ${i + 1}`}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  const next = [...steps];
                  next[i] = v === '' || v === '~' ? null : /^-?\d+$/.test(v) ? v : steps[i];
                  if (next[i] !== steps[i]) writeRoot(part.name, gridToMini(next));
                  else e.target.value = steps[i] ?? '';
                }}
              />
            );
          })}
        </span>
      ))}
    </div>
  );
}

/** Chord picker (C-c): one chord name per bar, with the notes Strudel voices them as. */
export function ChordEditor({ part, model }: { part: PartBlock; model: ProjectModel }) {
  const source = part.root.arg.kind === 'string' ? part.root.arg.value.trim() : null;
  const alt = source ? /^<([^<>\[\]]+)>$/.exec(source) : null;
  const chords = alt ? alt[1].trim().split(/\s+/) : source && /^\S+$/.test(source) ? [source] : null;
  const voiced = useVoicedNotes(model, part.name, chords?.length ?? 0);
  if (!chords) {
    return source !== null ? <MiniInput value={source} onCommit={(v) => writeRoot(part.name, v)} size={40} aria-label={`${part.name} chords`} /> : null;
  }
  const write = (next: string[]) => writeRoot(part.name, next.length === 1 ? next[0] : `<${next.join(' ')}>`);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chords.map((c, i) => (
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface px-2 py-1.5" key={i}>
          <Hint>bar {i + 1}</Hint>
          <MiniInput value={c} size={7} aria-label={`Chord in bar ${i + 1}`} onCommit={(v) => v.trim() && write(chords.map((x, j) => (j === i ? v.trim() : x)))} />
          <span className="font-mono text-[11px] text-muted">{voiced[i] ?? ''}</span>
          {chords.length > 1 && (
            <RemoveButton label={`Remove bar ${i + 1}`} onPress={() => write(chords.filter((_, j) => j !== i))} />
          )}
        </div>
      ))}
      <SmallButton onPress={() => write([...chords, chords[chords.length - 1]])}>+ bar</SmallButton>
    </div>
  );
}

/** The notes each bar's chord is voiced as, e.g. "c3 eb3 g3 bb3". */
function useVoicedNotes(model: ProjectModel, name: string, bars: number): string[] {
  const code = bars ? soloCode(model, name) : '';
  const [voiced, setVoiced] = useState<{ code: string; notes: string[] }>({ code: '', notes: [] });
  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    evaluatePure(code).then((r) => {
      if (cancelled || !r.ok) return;
      const notes = Array.from({ length: bars }, (_, bar) => {
        const haps = onsets(r.pattern, bar, bar + 1);
        const firstStart = haps[0]?.whole!.begin.valueOf();
        return [...new Set(haps.filter((h) => h.whole!.begin.valueOf() === firstStart).map((h) => String(h.value.note).toLowerCase()))].join(' ');
      });
      setVoiced({ code, notes });
    });
    return () => {
      cancelled = true;
    };
  }, [code, bars]);
  return voiced.code === code ? voiced.notes : [];
}

