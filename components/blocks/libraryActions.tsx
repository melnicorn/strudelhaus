'use client';

import { createContext, useContext } from 'react';
import type { LibraryItem } from '@/lib/storage/schema';

/** Library operations a view offers on block cards (the sandbox does; lessons don't). */
export interface LibraryActions {
  save(name: string): void;
  /** A newer library version of this block, if it was copied from the library (decision D2). */
  update(name: string): LibraryItem | undefined;
  applyUpdate(name: string, item: LibraryItem): void;
}

export const LibraryActionsContext = createContext<LibraryActions | null>(null);

export function useLibraryActions(): LibraryActions | null {
  return useContext(LibraryActionsContext);
}
