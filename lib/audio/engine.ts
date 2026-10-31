// The single place that plays audio through Strudel.
//
// Rules (see docs/research.md §5.5):
// - Strudel touches `window`, so every @strudel import here is a dynamic import inside create().
//   Importing this file from a client component is safe; it never runs Strudel at module load.
// - Strudel keeps global state (scheduler hooks, Pattern.prototype patches, the AudioContext),
//   so the engine is a module-level promise singleton. React StrictMode double mounts reuse it.
// - Never close() the AudioContext; superdough caches state against it.

export const SAMPLE_CDN = 'https://strudel.b-cdn.net';

export type EvalError = { message: string; line?: number; column?: number };
export type EvalResult = { ok: true; pattern: StrudelPattern } | { ok: false; error: EvalError };
export type LogMessage = { message: string; type: string };
export type Unsubscribe = () => void;

/** The parts of a Strudel Pattern we call. */
export interface StrudelPattern {
  queryArc(begin: number, end: number): StrudelHap[];
}
export interface StrudelHap {
  whole?: { begin: { valueOf(): number }; end: { valueOf(): number } };
  part: { begin: { valueOf(): number }; end: { valueOf(): number } };
  value: Record<string, unknown>;
  context: { locations?: { start: number; end: number }[] };
  hasOnset(): boolean;
}

interface Repl {
  scheduler: { now(): number; cps: number; started: boolean; pattern?: StrudelPattern };
  evaluate(code: string, autostart?: boolean): Promise<StrudelPattern | undefined>;
  stop(): void;
  start(): void;
  state: { started: boolean; miniLocations: [number, number][] };
}

type Listener<T> = (value: T) => void;

function emitter<T>() {
  const listeners = new Set<Listener<T>>();
  return {
    on(cb: Listener<T>): Unsubscribe {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    emit(value: T) {
      listeners.forEach((cb) => cb(value));
    },
  };
}

export type TriggerEvent = { hap: StrudelHap; time: number };

async function create() {
  const [core, mini, tonal, transpilerMod, webaudio, draw, workerTimers] = await Promise.all([
    import('@strudel/core'),
    import('@strudel/mini'),
    import('@strudel/tonal'),
    import('@strudel/transpiler'),
    import('@strudel/webaudio'),
    import('@strudel/draw'),
    import('worker-timers'),
  ]);

  // Make Strudel's functions (s, note, stack, …) visible to evaluated code.
  await core.evalScope(core, mini, tonal, webaudio, draw);

  const logs = emitter<LogMessage>();
  const playState = emitter<boolean>();
  const triggers = emitter<TriggerEvent>();
  const evaluated = emitter<{ code: string; pattern: StrudelPattern; miniLocations: [number, number][] }>();

  // Runtime errors ("sound x not found", query errors) only reach us through this DOM event.
  document.addEventListener('strudel.log', (e) => {
    const detail = (e as CustomEvent).detail ?? {};
    logs.emit({ message: String(detail.message ?? ''), type: String(detail.type ?? 'log') });
  });

  let lastEvalError: unknown;
  let triggerCount = 0;

  const repl: Repl = webaudio.webaudioRepl({
    transpiler: transpilerMod.transpiler,
    // Wrap the default output so the UI can tell that sound is actually being scheduled.
    defaultOutput: (hap: StrudelHap, deadline: number, duration: number, cps: number, t: number) => {
      triggerCount++;
      triggers.emit({ hap, time: t });
      return webaudio.webaudioOutput(hap, deadline, duration, cps, t);
    },
    onEvalError: (err: unknown) => {
      lastEvalError = err;
    },
    afterEval: ({ code, pattern, meta }: { code: string; pattern: StrudelPattern; meta?: { miniLocations?: [number, number][] } }) => {
      evaluated.emit({ code, pattern, miniLocations: meta?.miniLocations ?? [] });
    },
    onToggle: (started: boolean) => playState.emit(started),
    setInterval: workerTimers.setInterval,
    clearInterval: workerTimers.clearInterval,
  });

  // Sounds: synths now, sample maps register names only (audio loads on first use).
  await webaudio.registerSynthSounds();
  await Promise.all([
    webaudio.samples(`${SAMPLE_CDN}/tidal-drum-machines.json`, `${SAMPLE_CDN}/tidal-drum-machines/machines/`, {
      tag: 'drum-machines',
    }),
    webaudio.samples(`${SAMPLE_CDN}/uzu-drumkit.json`, `${SAMPLE_CDN}/uzu-drumkit/`),
    webaudio.samples(`${SAMPLE_CDN}/piano.json`, `${SAMPLE_CDN}/piano/`),
  ]);
  await webaudio.aliasBank(`${SAMPLE_CDN}/tidal-drum-machines-alias.json`);

  let audioReady: Promise<void> | null = null;

  return {
    /** Must be called from a user gesture (click / keydown) before the first play. */
    async unlock() {
      const ctx: AudioContext = webaudio.getAudioContext();
      // initAudio never resumes the context in 1.3.0 (upstream #2164), so resume it ourselves.
      if (ctx.state !== 'running') await ctx.resume();
      audioReady ??= webaudio.initAudio();
      await audioReady;
    },

    async evaluate(code: string): Promise<EvalResult> {
      if (!code.trim()) return { ok: false, error: { message: 'There is no code to run.' } };
      lastEvalError = undefined;
      const pattern = await repl.evaluate(code);
      if (lastEvalError || !pattern) return { ok: false, error: toEvalError(lastEvalError) };
      return { ok: true, pattern };
    },

    stop() {
      repl.stop();
    },
    isPlaying: () => repl.scheduler.started,
    getCycle: () => repl.scheduler.now(),
    getCps: () => repl.scheduler.cps,
    audioState: () => (webaudio.getAudioContext() as AudioContext).state,
    triggerCount: () => triggerCount,

    onLog: logs.on,
    onPlayState: playState.on,
    onTrigger: triggers.on,
    onEvaluated: evaluated.on,

    /** Names of every registered sound, for "did you mean" suggestions. */
    soundNames: (): string[] => Object.keys(webaudio.soundMap.get()),

    /**
     * Calls `cb` every animation frame while playing with the haps sounding right now.
     * Used for playing-note highlighting and the punchcard playhead.
     */
    onFrame(cb: (haps: StrudelHap[], cycle: number) => void): Unsubscribe {
      let raf = 0;
      let wasPlaying = false;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        const pattern = repl.scheduler.pattern;
        if (!repl.scheduler.started || !pattern) {
          if (wasPlaying) cb([], 0);
          wasPlaying = false;
          return;
        }
        wasPlaying = true;
        const now = repl.scheduler.now();
        try {
          const haps = pattern
            .queryArc(now, now + 1 / 1000)
            .filter((h) => h.whole && h.whole.begin.valueOf() <= now && now < h.whole.end.valueOf());
          cb(haps, now);
        } catch {
          // A pattern that throws while querying is reported through the strudel.log channel.
        }
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    },

    /**
     * Plays a snippet once, on top of whatever is playing, without touching the editor's
     * pattern (the sound browser). Uses the playing tempo, or the snippet's own setcpm.
     */
    async audition(code: string, bars = 1): Promise<{ ok: true } | { ok: false; message: string }> {
      const { evaluatePure, onsets } = await import('@/lib/strudel/pure');
      const result = await evaluatePure(code);
      if (!result.ok) return result;
      const cps = repl.scheduler.started ? repl.scheduler.cps : (result.cpm ?? 124 / 4) / 60;
      const haps = onsets(result.pattern, 0, bars);
      await this.preload(
        haps
          .filter((h) => typeof h.value.s === 'string')
          .map((h) => ({ s: String(h.value.s), bank: h.value.bank as string | undefined, n: Number(h.value.n ?? 0) })),
      );
      const ctx: AudioContext = webaudio.getAudioContext();
      const t0 = ctx.currentTime + 0.05;
      for (const h of haps) {
        const begin = h.whole!.begin.valueOf();
        const duration = (h.whole!.end.valueOf() - begin) / cps;
        void webaudio.superdough(h.value, t0 + begin / cps, duration, cps, begin);
        triggerCount++;
      }
      return { ok: true };
    },

    /** Fetch and decode sounds ahead of time so the first hit isn't dropped (gap G8). */
    async preload(sounds: { s: string; bank?: string; n?: number }[]) {
      await Promise.all(
        sounds.map(async ({ s, bank, n = 0 }) => {
          try {
            const key = bank ? `${bank}_${s}` : s;
            const sound = webaudio.getSound(key);
            if (sound?.data?.type !== 'sample') return;
            await webaudio.getSampleBuffer({ s: key, n }, sound.data.samples);
          } catch {
            // Preloading is best-effort; playback still loads lazily.
          }
        }),
      );
    },
  };
}

export type AudioEngine = Awaited<ReturnType<typeof create>>;

let enginePromise: Promise<AudioEngine> | null = null;

/** The one engine per page. Safe to call many times. */
export function getEngine(): Promise<AudioEngine> {
  if (typeof window === 'undefined') {
    throw new Error('The audio engine only runs in the browser.');
  }
  if (!enginePromise) {
    enginePromise = create();
    // Handy for debugging in the browser console during development.
    if (process.env.NODE_ENV !== 'production') {
      enginePromise.then((e) => Object.assign(window, { __engine: e }));
    }
  }
  return enginePromise;
}

function toEvalError(err: unknown): EvalError {
  if (!err) return { message: 'The code did not produce a pattern to play.' };
  const e = err as { message?: string; loc?: { line: number; column: number } };
  const message = String(e.message ?? err);
  if (e.loc) return { message, line: e.loc.line, column: e.loc.column };
  const mini = /line (\d+)/.exec(message);
  return { message, line: mini ? Number(mini[1]) : undefined };
}
