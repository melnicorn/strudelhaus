import { create } from 'zustand';
import { loadSettings, saveSettings } from '@/lib/storage/progress';
import type { Settings } from '@/lib/storage/schema';
import { settingsSchema } from '@/lib/storage/schema';

interface SettingsStore {
  settings: Settings;
  loaded: boolean;
  /** Reads saved settings; call from an effect (localStorage isn't there on the server). */
  load(): void;
  set<K extends keyof Settings>(key: K, value: Settings[K]): void;
}

/** User preferences (autocomplete on/off…), persisted to localStorage. */
export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: settingsSchema.parse({}),
  loaded: false,
  load() {
    if (!get().loaded) set({ settings: loadSettings(), loaded: true });
  },
  set(key, value) {
    const settings = { ...get().settings, [key]: value };
    set({ settings });
    saveSettings(settings);
  },
}));
