// Keep the existing storage key so saved divider positions carry over.
import { RELEASE_PREVIEW_SIZE_KEY } from 'src/bandcamp/domain/storageKey';
import { storage } from 'src/core/shared';
import { console } from 'src/utils/console';
import { writable } from 'svelte/store';

export const DEFAULT_ITEM_PREVIEW_SIZE = 45;
export const MIN_ITEM_PREVIEW_SIZE = 20;
export const MAX_ITEM_PREVIEW_SIZE = 80;

const previewSize = writable(DEFAULT_ITEM_PREVIEW_SIZE);
let restorePromise: Promise<void> | null = null;
let updateVersion = 0;

export const itemPreviewSize = {
  subscribe: previewSize.subscribe,
};

export function restoreItemPreviewSize(): Promise<void> {
  restorePromise ??= restoreStoredPreviewSize();
  return restorePromise;
}

export function updateItemPreviewSize(size: number): number {
  const normalizedSize = normalizePreviewSize(size);
  updateVersion += 1;
  previewSize.set(normalizedSize);
  return normalizedSize;
}

export function saveItemPreviewSize(size: number): void {
  const normalizedSize = updateItemPreviewSize(size);
  storage.setByKey(RELEASE_PREVIEW_SIZE_KEY, normalizedSize).catch((error) => {
    console.warn('BCX: Failed to save item preview size:', error);
  });
}

async function restoreStoredPreviewSize(): Promise<void> {
  const versionBeforeRestore = updateVersion;

  try {
    const storedSize = await storage.getByKey<unknown>(
      RELEASE_PREVIEW_SIZE_KEY,
    );
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

function normalizePreviewSize(size: number): number {
  return Math.min(MAX_ITEM_PREVIEW_SIZE, Math.max(MIN_ITEM_PREVIEW_SIZE, size));
}
