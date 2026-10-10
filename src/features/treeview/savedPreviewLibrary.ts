import type { RawAlbumData } from 'src/bandcamp/domain/album/compressor';
import type { CompressedBandData } from 'src/bandcamp/domain/band/compressor';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { StorageKey } from 'src/bandcamp/domain/storageKey';
import { storage } from 'src/core/shared';

type ReleaseLinkData = Pick<RawAlbumData, 'url' | 'artworkId'>;
type ReleaseIndex = Map<string, ReleaseLinkData[]>;
interface PreviewLibrary {
  keys?: Promise<string[]>;
  releases?: Promise<ReleaseIndex>;
  bands?: Promise<CompressedBandData[]>;
}

let library: PreviewLibrary = {};
const listeners = new Set<() => void>();

function releaseKey(title: string, artist: string): string {
  const normalize = (value: string) =>
    value.trim().replace(/\s+/g, ' ').toLowerCase();
  return JSON.stringify([normalize(title), normalize(artist)]);
}

function getKeys(current: PreviewLibrary): Promise<string[]> {
  if (!current.keys) {
    current.keys = storage.getKeys().catch((error: unknown) => {
      current.keys = undefined;
      throw error;
    });
  }
  return current.keys;
}

export async function getSavedPreviewReleases(
  title: string,
  artist: string,
): Promise<ReleaseLinkData[]> {
  const current: PreviewLibrary = listeners.size ? library : {};
  if (!current.releases) {
    current.releases = getKeys(current)
      .then((keys) => BandcampStorage.getAllAlbumsRawData(keys))
      .then((albums) => {
        const index: ReleaseIndex = new Map();
        for (const album of albums) {
          const key = releaseKey(album.title, album.artist);
          const matches = index.get(key) ?? [];
          matches.push({ url: album.url, artworkId: album.artworkId });
          index.set(key, matches);
        }
        return index;
      })
      .catch((error: unknown) => {
        current.releases = undefined;
        throw error;
      });
  }
  return (await current.releases).get(releaseKey(title, artist)) ?? [];
}

export function getSavedPreviewBands(): Promise<CompressedBandData[]> {
  const current: PreviewLibrary = listeners.size ? library : {};
  if (!current.bands) {
    current.bands = getKeys(current)
      .then((keys) => BandcampStorage.getAllCompressedBandData(keys))
      .catch((error: unknown) => {
        current.bands = undefined;
        throw error;
      });
  }
  return current.bands;
}

function onStorageChanged(
  changes: Record<string, chrome.storage.StorageChange>,
  area: string,
): void {
  if (area !== 'local') return;
  const keys = Object.keys(changes);
  const libraryChanged = keys.some(
    (key) => StorageKey.isAlbumKey(key) || StorageKey.isBandKey(key),
  );
  // Replace the generation so pending old reads cannot repopulate the cache.
  if (libraryChanged) library = {};
  if (libraryChanged || keys.includes('/following-bands')) {
    for (const listener of listeners) listener();
  }
}

// Share reads only while mounted consumers can keep the cache invalidated.
export function watchSavedPreviewLibrary(onChange: () => void): () => void {
  if (!listeners.size) chrome.storage.onChanged.addListener(onStorageChanged);
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
    if (!listeners.size) {
      chrome.storage.onChanged.removeListener(onStorageChanged);
      library = {};
    }
  };
}
