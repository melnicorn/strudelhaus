'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePlaying } from '@/components/transport/useEngine';
import { getEngine, type AudioEngine } from '@/lib/audio/engine';
import { friendlyEvalError, friendlyRuntimeMessage, type FriendlyError } from '@/lib/errors/friendly';

// Whether what is playing was started from a Styles page, and how many of those pages are
// mounted. Moving between sounds swaps the page, so the music stops only once none is left.
let ours = false;
let mounted = 0;

/** Plays the generated code, and keeps what you hear in step with it while it plays. */
export function usePlayer(code: string) {
  const [engine, setEngine] = useState<AudioEngine | null>(null);
  const [error, setError] = useState<FriendlyError | null>(null);
  const playing = usePlaying(engine);

  useEffect(() => {
    let cancelled = false;
    mounted++;
    getEngine().then((e) => {
      if (!cancelled) setEngine(e);
    });
    return () => {
      cancelled = true;
      mounted--;
      setTimeout(() => {
        if (mounted > 0 || !ours) return;
        ours = false;
        void getEngine().then((e) => e.stop());
      }, 0);
    };
  }, []);

  const run = useCallback(async (next: string) => {
    const e = await getEngine();
    await e.unlock();
    const result = await e.evaluate(next);
    ours = true;
    setError(result.ok ? null : friendlyEvalError(result.error.message, result.error.line));
  }, []);

  // A switch or knob moved while playing: update the sound, as the sandbox does on edit.
  useEffect(() => {
    if (!engine || !ours || !engine.isPlaying() || engine.lastCode() === code) return;
    const timer = setTimeout(() => void run(code), 120);
    return () => clearTimeout(timer);
  }, [code, engine, run]);

  useEffect(() => {
    if (!engine) return;
    return engine.onLog(({ message }) => {
      const friendly = friendlyRuntimeMessage(message, engine.soundNames);
      if (friendly && ours) setError(friendly);
    });
  }, [engine]);

  const toggle = useCallback(() => {
    if (engine?.isPlaying()) {
      ours = false;
      engine.stop();
    } else void run(code);
  }, [engine, run, code]);

  return { playing, toggle, error };
}
