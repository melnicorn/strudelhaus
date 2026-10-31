// Evaluates Strudel code to a Pattern without audio, for lesson checks, previews and tests.
// The second sanctioned place (with lib/audio/engine.ts) that imports @strudel/*. It works in
// the browser and in Node (Vitest), and never starts the scheduler.
import type { StrudelHap, StrudelPattern } from '@/lib/audio/engine';

type Mods = {
  core: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  mini: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  transpiler: (code: string, opts?: object) => { output: string; miniLocations: [number, number][] };
};

let modsPromise: Promise<Mods> | null = null;

function load(): Promise<Mods> {
  modsPromise ??= (async () => {
    const [core, mini, tonal, transpilerMod] = await Promise.all([
      import('@strudel/core'),
      import('@strudel/mini'),
      import('@strudel/tonal'),
      import('@strudel/transpiler'),
    ]);
    await core.evalScope(core, mini, tonal);
    return { core, mini, transpiler: transpilerMod.transpiler };
  })();
  return modsPromise;
}

export type PureResult =
  | { ok: true; pattern: StrudelPattern; cpm?: number; miniLocations: [number, number][] }
  | { ok: false; message: string; line?: number };

/**
 * Transpiles and evaluates code the way the REPL does, but with tempo and sample-loading
 * functions replaced by recorders so nothing global changes.
 */
export async function evaluatePure(code: string): Promise<PureResult> {
  const { core, transpiler } = await load();
  let cpm: number | undefined;
  const labelled: StrudelPattern[] = [];
  try {
    const { output, miniLocations } = transpiler(code, { emitWidgets: false });
    const stubs = {
      setcpm: (x: unknown) => ((cpm = Number(unpure(x))), core.silence),
      setcps: (x: unknown) => ((cpm = Number(unpure(x)) * 60), core.silence),
      hush: () => core.silence,
      samples: async () => undefined,
      all: () => core.silence,
      each: () => core.silence,
    };
    const names = Object.keys(stubs);
    const fn = Function(
      '__stubs',
      `"use strict";const {${names.join(',')}} = __stubs;const setCpm = setcpm, setCps = setcps;` +
        `return (async () => {${output}})()`,
    );
    // `$:` blocks call pattern.p(id). Collect them while the (synchronous) body runs.
    const proto = core.Pattern.prototype;
    const previousP = proto.p;
    proto.p = function (this: StrudelPattern, id: unknown) {
      if (!(typeof id === 'string' && (id.startsWith('_') || id.endsWith('_')))) labelled.push(this);
      return this;
    };
    let promise: Promise<unknown>;
    try {
      promise = fn(stubs);
    } finally {
      proto.p = previousP;
    }
    let value = await promise;
    if (labelled.length) value = core.stack(...labelled);
    if (!core.isPattern(value)) return { ok: false, message: 'The code did not produce a pattern.' };
    return { ok: true, pattern: value as StrudelPattern, cpm, miniLocations };
  } catch (err) {
    const e = err as { message?: string; loc?: { line: number } };
    const message = String(e.message ?? err);
    const mini = /line (\d+)/.exec(message);
    return { ok: false, message, line: e.loc?.line ?? (mini ? Number(mini[1]) : undefined) };
  }
}

function unpure(x: unknown): unknown {
  const p = x as { _Pattern?: boolean; __pure?: unknown };
  return p && p._Pattern ? p.__pure : x;
}

/** Haps that start inside [begin, end), sorted by onset. */
export function onsets(pattern: StrudelPattern, begin = 0, end = 1): StrudelHap[] {
  return pattern
    .queryArc(begin, end)
    .filter((h) => h.hasOnset())
    .sort((a, b) => a.whole!.begin.valueOf() - b.whole!.begin.valueOf());
}

/** Parses a mini-notation string (without quotes); throws on syntax errors. */
export async function parseMini(source: string): Promise<unknown> {
  const { mini } = await load();
  return mini.mini2ast(`"${source}"`);
}

/** Makes sure the Strudel modules are loaded (useful before a burst of evaluations). */
export async function warmUp(): Promise<void> {
  await load();
}
