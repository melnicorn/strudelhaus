import { create } from 'zustand';
import {
  addItemToProject,
  itemFromBlock,
  loadLibrary,
  loadProjects,
  newProject,
  rekeyBlockMeta,
  removeItem,
  saveLibrary,
  saveProjects,
  upsertItem,
} from '@/lib/storage/library';
import type { LibraryItem, Project } from '@/lib/storage/schema';

const CURRENT_KEY = 'sw:current-project:v1';

interface LibraryStore {
  loaded: boolean;
  items: LibraryItem[];
  projects: Project[];
  currentId: string | null;
  load(): void;
  setItems(items: LibraryItem[]): void;
  saveBlock(code: string, name: string, extra?: Parameters<typeof itemFromBlock>[2]): LibraryItem | null;
  deleteItem(id: string): void;
  current(): Project | null;
  selectProject(id: string): void;
  createProject(name: string, code: string): Project;
  renameProject(id: string, name: string): void;
  deleteProject(id: string): void;
  /** Saves the editor's code into the current project (debounced by the caller). */
  saveCode(code: string): void;
  addToProject(projectId: string, item: LibraryItem): void;
  /** Records that a block now matches its library original's latest version. */
  markUpdated(projectId: string, name: string, item: LibraryItem): void;
}

function readCurrent(): string | null {
  try {
    return localStorage.getItem(CURRENT_KEY);
  } catch {
    return null;
  }
}
function writeCurrent(id: string) {
  try {
    localStorage.setItem(CURRENT_KEY, id);
  } catch {
    // Not critical: the first project is used next time.
  }
}

/** The block library and the sandbox's saved projects (localStorage). */
export const useLibraryStore = create<LibraryStore>((set, get) => {
  const putProjects = (projects: Project[]) => {
    set({ projects });
    saveProjects(projects);
  };
  return {
    loaded: false,
    items: [],
    projects: [],
    currentId: null,
    load() {
      if (get().loaded) return;
      const projects = loadProjects();
      const saved = readCurrent();
      set({
        loaded: true,
        items: loadLibrary(),
        projects,
        currentId: projects.some((p) => p.id === saved) ? saved : (projects[0]?.id ?? null),
      });
    },
    setItems(items) {
      set({ items });
      saveLibrary(items);
    },
    saveBlock(code, name, extra) {
      const item = itemFromBlock(code, name, extra);
      if (!item) return null;
      // Saving a block that came from the library again updates that item (a new version).
      const project = get().current();
      const originId = project?.blockMeta[name]?.libraryOrigin?.id;
      const existing = get().items.find((x) => x.id === originId);
      const toSave = existing ? { ...item, id: existing.id, tags: existing.tags, role: existing.role } : item;
      const items = upsertItem(get().items, toSave);
      get().setItems(items);
      const saved = items.find((x) => x.id === toSave.id)!;
      if (project) get().markUpdated(project.id, name, saved);
      return saved;
    },
    deleteItem(id) {
      get().setItems(removeItem(get().items, id));
    },
    current() {
      const { projects, currentId } = get();
      return projects.find((p) => p.id === currentId) ?? null;
    },
    selectProject(id) {
      set({ currentId: id });
      writeCurrent(id);
    },
    createProject(name, code) {
      const p = newProject(name, code);
      putProjects([...get().projects, p]);
      get().selectProject(p.id);
      return p;
    },
    renameProject(id, name) {
      putProjects(get().projects.map((p) => (p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p)));
    },
    deleteProject(id) {
      const projects = get().projects.filter((p) => p.id !== id);
      putProjects(projects);
      if (get().currentId === id && projects[0]) get().selectProject(projects[0].id);
      if (!projects.length) set({ currentId: null });
    },
    saveCode(code) {
      const p = get().current();
      if (!p || p.code === code) return;
      const updated = rekeyBlockMeta({ ...p, code, updatedAt: new Date().toISOString() }, p.code);
      putProjects(get().projects.map((x) => (x.id === p.id ? updated : x)));
    },
    addToProject(projectId, item) {
      putProjects(get().projects.map((p) => (p.id === projectId ? addItemToProject(p, item) : p)));
    },
    markUpdated(projectId, name, item) {
      putProjects(
        get().projects.map((p) =>
          p.id === projectId ? { ...p, blockMeta: { ...p.blockMeta, [name]: { ...p.blockMeta[name], libraryOrigin: { id: item.id, version: item.version } } } } : p,
        ),
      );
    },
  };
});
