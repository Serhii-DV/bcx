import { RELEASE_PREVIEW_SIZE_KEY } from 'src/bandcamp/domain/storageKey';
import { storage } from 'src/core/shared';
import { console } from 'src/utils/console';
import { writable } from 'svelte/store';

export const DEFAULT_RELEASE_PREVIEW_SIZE = 45;
export const MIN_RELEASE_PREVIEW_SIZE = 20;
export const MAX_RELEASE_PREVIEW_SIZE = 80;

const previewSize = writable(DEFAULT_RELEASE_PREVIEW_SIZE);
let restorePromise: Promise<void> | null = null;
let updateVersion = 0;

export const releasePreviewSize = {
  subscribe: previewSize.subscribe,
};

export function restoreReleasePreviewSize(): Promise<void> {
  restorePromise ??= restoreStoredPreviewSize();
  return restorePromise;
}

export function updateReleasePreviewSize(size: number): number {
  const normalizedSize = normalizePreviewSize(size);
  updateVersion += 1;
  previewSize.set(normalizedSize);
  return normalizedSize;
}

export function saveReleasePreviewSize(size: number): void {
  const normalizedSize = updateReleasePreviewSize(size);
  storage.setByKey(RELEASE_PREVIEW_SIZE_KEY, normalizedSize).catch((error) => {
    console.warn('BCX: Failed to save release preview size:', error);
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
    console.warn('BCX: Failed to restore release preview size:', error);
  }
}

function normalizePreviewSize(size: number): number {
  return Math.min(
    MAX_RELEASE_PREVIEW_SIZE,
    Math.max(MIN_RELEASE_PREVIEW_SIZE, size),
  );
}
