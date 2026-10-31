// Outlines the mini-notation tokens that are sounding right now.
// Adapted from @strudel/codemirror's highlight.mjs (AGPL-3.0): the transpiler reports the
// source range of every mini-notation leaf, and each hap carries the ranges it came from.
import { RangeSetBuilder, StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, type DecorationSet } from '@codemirror/view';
import type { StrudelHap } from '@/lib/audio/engine';

export const setMiniLocations = StateEffect.define<[number, number][]>();
export const setActiveHaps = StateEffect.define<StrudelHap[]>();

/** Marks for every mini-notation leaf; remapped as the document is edited. */
const locationsField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(marks, tr) {
    marks = marks.map(tr.changes);
    for (const e of tr.effects) {
      if (!e.is(setMiniLocations)) continue;
      const len = tr.newDoc.length;
      marks = Decoration.set(
        e.value
          .filter(([from, to]) => from < len && to > from)
          .map(([from, to]) => Decoration.mark({ id: `${from}:${to}` }).range(from, Math.min(to, len))),
        true,
      );
    }
    return marks;
  },
});

/** Ids ("start:end", as reported at evaluation time) of the leaves playing now. */
const activeField = StateField.define<Set<string>>({
  create: () => new Set(),
  update(active, tr) {
    for (const e of tr.effects) {
      if (!e.is(setActiveHaps)) continue;
      active = new Set();
      for (const hap of e.value) {
        for (const { start, end } of hap.context?.locations ?? []) active.add(`${start}:${end}`);
      }
    }
    return active;
  },
});

const playingMark = Decoration.mark({ class: 'cm-playing' });

const highlights = EditorView.decorations.compute([locationsField, activeField], (state) => {
  const active = state.field(activeField);
  const builder = new RangeSetBuilder<Decoration>();
  if (active.size === 0) return builder.finish();
  const iter = state.field(locationsField).iter();
  while (iter.value) {
    if (active.has(iter.value.spec.id)) builder.add(iter.from, iter.to, playingMark);
    iter.next();
  }
  return builder.finish();
});

export const playingHighlight = [locationsField, activeField, highlights];

export function updateMiniLocations(view: EditorView, locations: [number, number][]) {
  view.dispatch({ effects: setMiniLocations.of(locations) });
}

export function showActiveHaps(view: EditorView, haps: StrudelHap[]) {
  view.dispatch({ effects: setActiveHaps.of(haps) });
}
