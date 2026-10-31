'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { getEngine, type AudioEngine } from '@/lib/audio/engine';

/** Loads the shared audio engine on the client. Returns null until it's ready. */
export function useEngine() {
  const [engine, setEngine] = useState<AudioEngine | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getEngine()
      .then((e) => !cancelled && setEngine(e))
      .catch((err) => !cancelled && setError(String(err?.message ?? err)));
    return () => {
      cancelled = true;
    };
  }, []);

  return { engine, loadError: error };
}

/** Tracks whether the engine is playing. */
export function usePlaying(engine: AudioEngine | null) {
  const subscribe = useCallback((cb: () => void) => (engine ? engine.onPlayState(cb) : () => {}), [engine]);
  return useSyncExternalStore(
    subscribe,
    () => engine?.isPlaying() ?? false,
    () => false,
  );
}
