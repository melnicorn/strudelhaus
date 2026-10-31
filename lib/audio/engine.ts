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
  /** `lastEnd` is the cycle the scheduler will continue from after a pause (0 after a stop). */
  scheduler: { now(): number; cps: number; started: boolean; lastEnd: number; pattern?: StrudelPattern };
  evaluate(code: string, autostart?: boolean): Promise<StrudelPattern | undefined>;
  stop(): void;
  start(): Promise<void>;
  pause(): void;
  state: { started: boolean; miniLocations: [number, number][] };
}

export type PlayState = 'playing' | 'paused' | 'stopped';

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
  const playState$ = emitter<boolean>();
  const triggers = emitter<TriggerEvent>();
  const evaluated = emitter<{ code: string; pattern: StrudelPattern; miniLocations: [number, number][] }>();

  // Runtime errors ("sound x not found", query errors) only reach us through this DOM event.
  document.addEventListener('strudel.log', (e) => {
    const detail = (e as CustomEvent).detail ?? {};
    logs.emit({ message: String(detail.message ?? ''), type: String(detail.type ?? 'log') });
  });

  let lastEvalError: unknown;
  let triggerCount = 0;
  let lastCode: string | undefined;

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
      lastCode = code;
      evaluated.emit({ code, pattern, miniLocations: meta?.miniLocations ?? [] });
    },
    onToggle: (started: boolean) => playState$.emit(started),
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

  // The master gain, for cutting the sound at once. Pause and stop fade it over 30 ms (no click);
  // play brings it back. Superdough rebuilds the node on resetGlobalEffects, so look it up each time.
  const master = (): GainNode | undefined => webaudio.getSuperdoughAudioController().output?.destinationGain ?? undefined;
  const FADE = 0.03;
  const fade = (to: number) => {
    const ctx: AudioContext = webaudio.getAudioContext();
    const g = master()?.gain;
    if (!g) return;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(g.value, ctx.currentTime);
    g.linearRampToValueAtTime(to, ctx.currentTime + FADE);
  };
  // Pause and stop finish their work after the fade; a play in between cancels it.
  let settle = 0;
  const afterFade = (fn: () => void) => {
    const token = ++settle;
    setTimeout(() => token === settle && !repl.scheduler.started && fn(), FADE * 1000 + 20);
  };
  const playState = (): PlayState => (repl.scheduler.started ? 'playing' : repl.scheduler.lastEnd > 0 ? 'paused' : 'stopped');

  return {
    /** Must be called from a user gesture (click / keydown) before the first play. */
    async unlock() {
      const ctx: AudioContext = webaudio.getAudioContext();
      // initAudio never resumes the context in 1.3.0 (upstream #2164), so resume it ourselves.
      if (ctx.state !== 'running') await ctx.resume();
      audioReady ??= webaudio.initAudio();
      await audioReady;
      settle++;
      fade(1);
    },

    async evaluate(code: string): Promise<EvalResult> {
      if (!code.trim()) return { ok: false, error: { message: 'There is no code to run.' } };
      lastEvalError = undefined;
      const pattern = await repl.evaluate(code);
      if (lastEvalError || !pattern) return { ok: false, error: toEvalError(lastEvalError) };
      return { ok: true, pattern };
    },

    /** Stops at once and goes back to bar 1; effect tails are cleared so nothing bleeds into the next play. */
    stop() {
      const wasPaused = playState() === 'paused';
      fade(0);
      repl.stop();
      afterFade(() => webaudio.resetGlobalEffects());
      if (wasPaused) playState$.emit(false);
    },
    /** Freezes the sound where it is; play (or update) continues from the same beat. */
    pause() {
      if (!repl.scheduler.started) return;
      fade(0);
      repl.pause();
      afterFade(() => void (webaudio.getAudioContext() as AudioContext).suspend());
    },
    /** Continues after a pause with the pattern that was playing. */
    async resume() {
      await this.unlock();
      if (playState() === 'paused') await repl.start();
    },
    playState,
    /** The code of the last successful evaluation (to tell whether an update is needed). */
    lastCode: () => lastCode,
    /** The bar the music is paused at (1-based). */
    pausedBar: () => Math.floor(repl.scheduler.lastEnd) + 1,
    isPlaying: () => repl.scheduler.started,
    getCycle: () => repl.scheduler.now(),
    getCps: () => repl.scheduler.cps,
    audioState: () => (webaudio.getAudioContext() as AudioContext).state,
    triggerCount: () => triggerCount,

    onLog: logs.on,
    onPlayState: playState$.on,
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
