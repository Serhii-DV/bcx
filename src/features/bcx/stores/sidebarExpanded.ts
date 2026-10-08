import { SIDEBAR_EXPANDED_KEY } from 'src/bandcamp/domain/storageKey';
import { storage } from 'src/core/shared';
import { console } from 'src/utils/console';
import { writable } from 'svelte/store';

export const sidebarExpanded = writable(false);
let restorePromise: Promise<void> | null = null;
let updateVersion = 0;

export function restoreSidebarExpanded(): Promise<void> {
  restorePromise ??= restore();
  return restorePromise;
}

export function saveSidebarExpanded(expanded: boolean): void {
  updateVersion += 1;
  sidebarExpanded.set(expanded);
  storage.setByKey(SIDEBAR_EXPANDED_KEY, expanded).catch((error) => {
    console.warn('BCX: Failed to save sidebar expansion:', error);
  });
}

async function restore(): Promise<void> {
  const version = updateVersion;
  try {
    const stored = await storage.getByKey<unknown>(SIDEBAR_EXPANDED_KEY);
    if (version === updateVersion && typeof stored === 'boolean') {
      sidebarExpanded.set(stored);
    }
  } catch (error) {
    console.warn('BCX: Failed to restore sidebar expansion:', error);
  }
}
