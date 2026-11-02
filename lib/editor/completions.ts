// Editor autocomplete. What's suggested depends on where the cursor is:
//   after a dot           → methods (from the reference)
//   start of an expression → top-level functions, signals and your own const names
//   inside s("…")          → drum names (of the part's .bank() machine if it has one) and synths
//   inside .bank("…")      → machines
//   inside .scale("…")     → scales, after the root and colon
//   inside .ftype("…") …   → that method's fixed choices
// Anywhere else inside a string (rhythms, notes) nothing pops up.
// This module is loaded on first use (see autocomplete.ts), so the reference stays out of the
// initial bundle.
import type { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { localCompletionSource } from '@codemirror/lang-javascript';
import { syntaxTree } from '@codemirror/language';
import type { EditorState } from '@codemirror/state';
import type { SyntaxNode } from '@lezer/common';
import { CHORD_QUALITIES, COMMON_QUALITIES } from '@/lib/music/chords';
import { learnedIn, REFERENCE, type RefEntry } from '@/lib/reference/entries';
import { DEFAULT_MACHINE, DRUM_NAMES, findMachine, MACHINES, SYNTHS } from '@/lib/sounds/catalog';
import { METHODS } from '@/lib/sync/allowlist';

/**
 * Scales that suit house and techno, with how they feel. Multi-word Tonal names use colons, since
 * a space in mini-notation would split them into two steps.
 */
export const SCALES: [string, string][] = [
  ['minor', 'dark, the default'],
  ['dorian', 'deep house, jazzy'],
  ['phrygian', 'tense techno'],
  ['minor:pentatonic', "can't go wrong"],
  ['harmonic:minor', 'dramatic, eastern'],
  ['major', 'bright, uplifting'],
  ['major:pentatonic', 'happy, simple'],
  ['mixolydian', 'bluesy major'],
  ['lydian', 'dreamy, floating'],
  ['locrian', 'unsettled'],
  ['minor:blues', 'gritty'],
  ['chromatic', 'every note'],
];

const IDENT = /^[A-Za-z_$][\w$]*$/;
// Functions that start an expression (the rest of the reference are methods).
const ROOT_FNS = ['s', 'sound', 'n', 'note', 'chord', 'stack', 'arrange', 'cat', 'setcpm', 'setcps'];
const SIGNALS = ['sine', 'cosine', 'saw', 'tri', 'square', 'rand', 'perlin', 'irand'];
const NOT_METHODS = new Set(['setcpm', 'setcps', 'stack', 'arrange', 'cat', 'sine', 'rand']);

function info(entry: RefEntry): () => Node {
  return () => {
    const root = document.createElement('div');
    root.className = 'cm-ref-info';
    const lesson = learnedIn(entry);
    const meta = [entry.category, lesson && `Lesson ${lesson}`].filter(Boolean).join(' · ');
    root.innerHTML = '<b></b><div></div><div class="cm-ref-ex"></div><div class="cm-ref-meta"></div>';
    const [title, does, ex, foot] = root.children as unknown as HTMLElement[];
    title.textContent = entry.display;
    does.textContent = `${entry.does}${entry.takes && entry.takes !== '—' ? ` Takes ${entry.takes}.` : ''}${entry.caveat ? ` ${entry.caveat}` : ''}`;
    ex.textContent = entry.example;
    foot.textContent = meta;
    return root;
  };
}

function textInfo(title: string, body: string, meta?: string): () => Node {
  return () => {
    const root = document.createElement('div');
    root.className = 'cm-ref-info';
    const b = document.createElement('b');
    b.textContent = title;
    root.append(b, body);
    if (meta) {
      const m = document.createElement('div');
      m.className = 'cm-ref-meta';
      m.textContent = meta;
      root.append(m);
    }
    return root;
  };
}

/** Reference entries keyed by every name they answer to (aliases too). */
const BY_NAME = new Map<string, RefEntry>();
for (const e of REFERENCE) {
  if (IDENT.test(e.name)) BY_NAME.set(e.name, e);
  for (const a of e.aliases?.split(/[,/]\s*/) ?? []) {
    const name = a.trim();
    if (IDENT.test(name) && !BY_NAME.has(name)) BY_NAME.set(name, e);
  }
}

/** Right-column labels for the hand-written reference entries (GUI methods use their spec label). */
const SHORT: Record<string, string> = {
  note: 'pitches',
  chord: 'chord names',
  rootNotes: 'chord roots',
  stack: 'play together',
  arrange: 'sections in order',
  cat: 'one per cycle',
  lastOf: 'every n cycles',
  ply: 'repeat events',
  fast: 'speed up',
  slow: 'slow down',
  rev: 'backwards',
  off: 'shifted copy',
  degradeBy: 'drop some events',
  sometimesBy: 'sometimes apply',
  seed: 'random variation',
  mask: 'silence where 0',
  struct: 'new rhythm',
  swingBy: 'swing',
  range: 'scale a signal',
  seg: 'chop into n',
  setcpm: 'tempo',
};
const shortLabel = (name: string, e: RefEntry) => SHORT[name] ?? SHORT[e.name] ?? METHODS[name]?.label ?? e.does.split(/[.:(]/)[0].toLowerCase();

// Among equal matches, the GUI's methods come first in their menu order (lpf before lpattack),
// then the rest of the reference.
const RANK = [...Object.keys(METHODS), ...REFERENCE.map((e) => e.name)];
const rankBoost = (name: string, e: RefEntry) => {
  const i = RANK.indexOf(name) >= 0 ? RANK.indexOf(name) : RANK.indexOf(e.name);
  return -(i < 0 ? RANK.length : i) / (RANK.length + 1);
};

const METHOD_OPTIONS: Completion[] = [...BY_NAME]
  .filter(([name]) => !NOT_METHODS.has(name) && !SIGNALS.includes(name))
  .map(([name, e]) => ({ label: name, type: 'method', detail: shortLabel(name, e), info: info(e), boost: rankBoost(name, e) }));

const TOP_OPTIONS: Completion[] = [...ROOT_FNS, ...SIGNALS].map((name) => {
  const e = BY_NAME.get(name);
  const signal = SIGNALS.includes(name);
  return { label: name, type: signal ? 'variable' : 'function', detail: signal ? 'signal' : e ? shortLabel(name, e) : undefined, info: e && info(e), boost: signal ? -1 : 1 };
});

const MACHINE_OPTIONS: Completion[] = MACHINES.map((m, i) => ({
  label: m.bank,
  type: m.classic ? 'classic' : 'machine',
  detail: m.year ? String(m.year) : undefined,
  info: textInfo(m.name, m.blurb ?? '', m.sounds.map(([s]) => s).join(' ')),
  // Keep the curated order (classics by year) among equal matches.
  boost: -i / MACHINES.length,
}));

const SCALE_OPTIONS: Completion[] = SCALES.map(([name, feel], i) => ({ label: name, type: 'scale', detail: feel, boost: -i / SCALES.length }));

/** Chord qualities for chord("…"): the common ones first, then the whole ireal dictionary. */
const CHORD_OPTIONS: Completion[] = [
  ...COMMON_QUALITIES.filter(([q]) => q).map(([q, what], i) => ({ label: q, type: 'chord', detail: what, boost: 1 - i / COMMON_QUALITIES.length })),
  ...CHORD_QUALITIES.filter((q) => q && !COMMON_QUALITIES.some(([c]) => c === q)).map((q) => ({ label: q, type: 'chord', boost: -1 })),
];

const SYNTH_OPTIONS: Completion[] = SYNTHS.map((s) => ({ label: s.sound, type: 'synth', detail: s.kind, info: textInfo(s.sound, s.blurb), boost: -1 }));

function soundOptions(bank: string | undefined): Completion[] {
  const machine = (bank && findMachine(bank)) || DEFAULT_MACHINE;
  const drums = machine.sounds.map(([s, count]): Completion => {
    const what = DRUM_NAMES[s];
    return {
      label: s,
      type: 'drum',
      detail: what ? `${what} · ${count}` : String(count),
      info: textInfo(s, `${what ? what[0].toUpperCase() + what.slice(1) : s} on the ${machine.name}. ${count > 1 ? `Add :n to pick one of ${count} variants.` : 'One variant.'}`),
    };
  });
  return bank && machine !== DEFAULT_MACHINE ? drums : [...drums, ...SYNTH_OPTIONS];
}

/** The name of the function a call node calls: `s` for s(…), `bank` for x.bank(…). */
function calleeName(state: EditorState, call: SyntaxNode): string | undefined {
  const callee = call.firstChild;
  if (!callee) return undefined;
  if (callee.name === 'VariableName') return state.sliceDoc(callee.from, callee.to);
  if (callee.name === 'MemberExpression') {
    const prop = callee.lastChild;
    if (prop?.name === 'PropertyName') return state.sliceDoc(prop.from, prop.to);
  }
  return undefined;
}

/** The first string argument of a call, unquoted. */
function firstStringArg(state: EditorState, call: SyntaxNode): string | undefined {
  const arg = call.getChild('ArgList')?.getChild('String');
  return arg ? state.sliceDoc(arg.from + 1, arg.to - 1) : undefined;
}

/** The .bank("…") further along the same chain as this s(…) call, if any. */
function chainBank(state: EditorState, call: SyntaxNode): string | undefined {
  for (let node: SyntaxNode | null = call; node?.parent?.name === 'MemberExpression'; ) {
    const outer: SyntaxNode | null = node.parent.parent;
    if (outer?.name !== 'CallExpression') break;
    if (calleeName(state, outer) === 'bank') return firstStringArg(state, outer);
    node = outer;
  }
  return undefined;
}

function stringCompletions(context: CompletionContext, str: SyntaxNode): CompletionResult | null {
  const { state, pos } = context;
  const args = str.parent;
  const call = args?.name === 'ArgList' ? args.parent : null;
  // Only the first argument, and only directly inside the call.
  if (call?.name !== 'CallExpression' || args?.firstChild?.nextSibling?.from !== str.from) return null;
  const fn = calleeName(state, call);
  if (!fn) return null;
  const word = context.matchBefore(/[\w#:.-]*/);
  const fragment = word?.text ?? '';
  const from = word?.from ?? pos;

  if (fn === 's' || fn === 'sound') {
    // After "bd:" comes a variant number: nothing to suggest.
    if (fragment.includes(':') || (!fragment && !context.explicit)) return null;
    return { from, options: soundOptions(chainBank(state, call)), validFor: /^\w*$/ };
  }
  if (fn === 'bank') return { from, options: MACHINE_OPTIONS, validFor: /^\w*$/ };
  if (fn === 'chord') {
    // After a root ("Ab", "F#") comes the quality: ^7, -7, 7… Strudel's own spellings.
    const chordWord = context.matchBefore(/[A-Ga-g][#b]?[\w^#+-]*$/);
    if (!chordWord) return null;
    const root = /^[A-Ga-g][#b]?/.exec(chordWord.text)![0];
    return { from: chordWord.from + root.length, options: CHORD_OPTIONS, validFor: /^[\w^#+-]*$/ };
  }
  if (fn === 'scale') {
    // "C:minor:pen" → complete everything after the root's colon.
    const colon = fragment.indexOf(':');
    if (colon < 0) return null;
    return { from: from + colon + 1, options: SCALE_OPTIONS, validFor: /^[a-z:]*$/ };
  }
  const options = METHODS[fn]?.arg === 'enum' ? METHODS[fn].options : undefined;
  if (options) return { from, options: options.map((o) => ({ label: o, type: 'enum' })), validFor: /^[\w-]*$/ };
  return null;
}

export function strudelCompletions(context: CompletionContext): CompletionResult | null {
  const { state, pos } = context;
  const node = syntaxTree(state).resolveInner(pos, -1);
  if (node.name === 'String') {
    // Inside the quotes, not just after the closing one.
    const closed = node.to - node.from >= 2 && state.sliceDoc(node.to - 1, node.to) === state.sliceDoc(node.from, node.from + 1);
    return pos > node.from && (pos < node.to || !closed) ? stringCompletions(context, node) : null;
  }
  if (/Comment|TemplateString|Number|VariableDefinition/.test(node.name)) return null;

  const method = context.matchBefore(/\.\s*[\w$]*$/);
  if (method) {
    const dot = state.sliceDoc(method.from - 1, method.from);
    if (/\d/.test(dot)) return null; // a decimal number like 0.5
    return { from: pos - (method.text.match(/[\w$]*$/)?.[0].length ?? 0), options: METHOD_OPTIONS, validFor: /^[\w$]*$/ };
  }

  const word = context.matchBefore(/[\w$]+$/);
  if (!word && !context.explicit) return null;
  const local = localCompletionSource(context);
  const mine = new Set(TOP_OPTIONS.map((o) => o.label));
  const locals = (local?.options ?? []).filter((o) => !mine.has(o.label)).map((o) => ({ ...o, type: 'part', detail: 'your part' }));
  return { from: word?.from ?? pos, options: [...TOP_OPTIONS, ...locals], validFor: /^[\w$]*$/ };
}
