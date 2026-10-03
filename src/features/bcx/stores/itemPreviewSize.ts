// Keep the existing storage key so saved divider positions carry over.
import {
  BAND_RELEASE_PREVIEW_SIZE_KEY,
  RELEASE_PREVIEW_SIZE_KEY,
} from 'src/bandcamp/domain/storageKey';
import { storage } from 'src/core/shared';
import { console } from 'src/utils/console';
import { writable } from 'svelte/store';

export const DEFAULT_ITEM_PREVIEW_SIZE = 45;
export const MIN_ITEM_PREVIEW_SIZE = 20;
export const MAX_ITEM_PREVIEW_SIZE = 80;

export const itemPreviewSize = createPreviewSizeStore(RELEASE_PREVIEW_SIZE_KEY);
export const bandReleasePreviewSize = createPreviewSizeStore(
  BAND_RELEASE_PREVIEW_SIZE_KEY,
);
export type ItemPreviewSizeStore = typeof itemPreviewSize;

export const restoreItemPreviewSize = itemPreviewSize.restore;
export const updateItemPreviewSize = itemPreviewSize.update;
export const saveItemPreviewSize = itemPreviewSize.save;

function createPreviewSizeStore(storageKey: string) {
  const previewSize = writable(DEFAULT_ITEM_PREVIEW_SIZE);
  let restorePromise: Promise<void> | null = null;
  let updateVersion = 0;

  function restoreItemPreviewSize(): Promise<void> {
    restorePromise ??= restoreStoredPreviewSize();
    return restorePromise;
  }

  function updateItemPreviewSize(size: number): number {
    const normalizedSize = normalizePreviewSize(size);
    updateVersion += 1;
    previewSize.set(normalizedSize);
    return normalizedSize;
  }

  function saveItemPreviewSize(size: number): void {
    const normalizedSize = updateItemPreviewSize(size);
    storage.setByKey(storageKey, normalizedSize).catch((error) => {
      console.warn('BCX: Failed to save item preview size:', error);
    });
  }

  async function restoreStoredPreviewSize(): Promise<void> {
    const versionBeforeRestore = updateVersion;

    try {
      const storedSize = await storage.getByKey<unknown>(storageKey);
      if (
        versionBeforeRestore === updateVersion &&
        typeof storedSize === 'number' &&
        Number.isFinite(storedSize)
      ) {
        previewSize.set(normalizePreviewSize(storedSize));
      }
    } catch (error) {
      console.warn('BCX: Failed to restore item preview size:', error);
    }
  }

  return {
    subscribe: previewSize.subscribe,
    restore: restoreItemPreviewSize,
    update: updateItemPreviewSize,
    save: saveItemPreviewSize,
  };
}

function normalizePreviewSize(size: number): number {
  return Math.min(MAX_ITEM_PREVIEW_SIZE, Math.max(MIN_ITEM_PREVIEW_SIZE, size));
}
