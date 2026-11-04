// Which lesson packs are loaded: the core pack always, the site's extra packs (public/packs/
// index.json, fetched at runtime so new packs need no rebuild) and packs the learner imported
// from a file or URL (kept in localStorage). Components read lessons through this store so they
// re-render when a pack arrives.
import { create } from 'zustand';
import { z } from 'zod';
import { getEngine } from '@/lib/audio/engine';
import { allPacks, onPacksChange, registerPack, setPackOrder, unregisterPack } from '@/lib/lessons/packs';
import type { Pack } from '@/lib/lessons/types';
import { validatePack, type Finding } from '@/lib/lessons/validate';
import { KEYS, readJson, writeJson } from '@/lib/storage/kv';

const storedSchema = z.array(z.object({ url: z.string().optional(), json: z.unknown() }));
type Stored = z.infer<typeof storedSchema>;

interface PacksStore {
  packs: Pack[];
  /** Built-in extra packs and imported packs have been loaded (the core pack is always there). */
  loaded: boolean;
  /** Where each imported pack came from, by pack id. */
  sources: Record<string, string | undefined>;
  load(): Promise<void>;
  /** Validates and adds a pack from its JSON. Returns the findings; the pack is added only with no errors. */
  importPack(json: unknown, url?: string): Promise<{ findings: Finding[]; pack?: Pack }>;
  /** Fetches a pack's JSON and imports it. */
  importUrl(url: string): Promise<{ findings: Finding[]; pack?: Pack }>;
  removePack(id: string): void;
  /** Packs folded up on the Learn page (remembered in this browser). */
  collapsed: Set<string>;
  toggleCollapsed(id: string): void;
}

async function samplesFor(pack: Pack) {
  if (!pack.samples?.length) return;
  const engine = await getEngine();
  await Promise.all(pack.samples.map((s) => engine.loadSamples(s.url, s.base).catch(() => undefined)));
}

export const usePacksStore = create<PacksStore>((set, get) => {
  onPacksChange(() => set({ packs: allPacks() }));
  return {
    packs: allPacks(),
    loaded: false,
    sources: {},
    collapsed: new Set(),
    toggleCollapsed(id) {
      const collapsed = new Set(get().collapsed);
      if (collapsed.has(id)) collapsed.delete(id);
      else collapsed.add(id);
      writeJson(KEYS.mapCollapsed, [...collapsed]);
      set({ collapsed });
    },
    async load() {
      if (get().loaded) return;
      set({ loaded: true, collapsed: new Set(readJson(KEYS.mapCollapsed, z.array(z.string()), [])) });
      // The site's extra packs: a list of files beside the app, fetched when the map opens.
      try {
        const index = await fetch('/packs/index.json', { cache: 'no-cache' });
        if (index.ok) {
          const files = z.array(z.string()).parse(await index.json());
          setPackOrder(files.map((f) => f.replace(/\.json$/, '')));
          await Promise.all(
            files.map(async (file) => {
              try {
                const json = await (await fetch(`/packs/${file}`, { cache: 'no-cache' })).json();
                const r = await validatePack(json, { builtin: true, quick: true });
                if (r.pack) {
                  registerPack(r.pack);
                  void samplesFor(r.pack);
                } else console.warn(`Pack ${file} was not loaded:`, r.findings);
              } catch (e) {
                console.warn(`Pack ${file} was not loaded:`, e);
              }
            }),
          );
        }
      } catch {
        // No extra packs (or offline): the core pack is enough.
      }
      // Packs the learner imported earlier: already validated, so only a quick compile.
      const stored = readJson(KEYS.packs, storedSchema, [] as Stored);
      const sources: Record<string, string | undefined> = {};
      for (const { url, json } of stored) {
        const r = await validatePack(json, { quick: true });
        if (r.pack) {
          registerPack(r.pack);
          sources[r.pack.id] = url;
          void samplesFor(r.pack);
        }
      }
      set({ sources, packs: allPacks() });
    },
    async importPack(json, url) {
      const r = await validatePack(json);
      if (!r.pack || r.errors) return { findings: r.findings };
      if (r.pack.id === 'core' || r.pack.source === 'builtin') return { findings: [{ level: 'error', message: 'A pack with that id is built in.' }] };
      registerPack(r.pack);
      void samplesFor(r.pack);
      const stored = readJson(KEYS.packs, storedSchema, [] as Stored).filter((s) => (s.json as { id?: string })?.id !== r.pack!.id);
      writeJson(KEYS.packs, [...stored, { url, json }]);
      set({ sources: { ...get().sources, [r.pack.id]: url }, packs: allPacks() });
      return { findings: r.findings, pack: r.pack };
    },
    async importUrl(url) {
      try {
        const res = await fetch(url);
        if (!res.ok) return { findings: [{ level: 'error', message: `Couldn’t fetch it: HTTP ${res.status}` }] };
        return get().importPack(await res.json(), url);
      } catch (e) {
        return { findings: [{ level: 'error', message: `Couldn’t fetch it: ${(e as Error).message}` }] };
      }
    },
    removePack(id) {
      unregisterPack(id);
      const stored = readJson(KEYS.packs, storedSchema, [] as Stored).filter((s) => (s.json as { id?: string })?.id !== id);
      writeJson(KEYS.packs, stored);
      const { [id]: _gone, ...sources } = get().sources;
      void _gone;
      set({ sources, packs: allPacks() });
    },
  };
});
