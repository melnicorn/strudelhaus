import { create } from 'zustand';
import type { SoundState } from '@/lib/styles/types';

// The switches and knobs of each sound on the Styles pages, kept while you move between sounds
// and styles (not saved: a reload starts every sound from its config).
interface StylesStore {
  /** By "<style id>/<sound id>". */
  states: Record<string, SoundState>;
  setState(key: string, state: SoundState): void;
  /** Play sounds over the style's backing loop. */
  inContext: boolean;
  setInContext(inContext: boolean): void;
}

export const useStylesStore = create<StylesStore>((set) => ({
  states: {},
  setState: (key, state) => set((s) => ({ states: { ...s.states, [key]: state } })),
  inContext: false,
  setInContext: (inContext) => set({ inContext }),
}));
