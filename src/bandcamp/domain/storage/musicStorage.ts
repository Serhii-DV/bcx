import type { StorableData } from 'src/core/storage';
import {
  albumDataCompressor,
  bandDataCompressor,
  trackDataCompressor,
} from '../shared';
import { StorageKey } from '../storageKey';
import { requestMusicLibrary } from './musicLibrary';
import type { MusicLibraryData, MusicStore } from './musicLibraryProtocol';

function storableData(data: MusicLibraryData): StorableData {
  return Object.fromEntries([
    ...data.bands.map((band) => [
      StorageKey.bandKey(band.id),
      bandDataCompressor.compress(band),
    ]),
    ...data.albums.map((album) => [
      StorageKey.albumKey(album.id),
      albumDataCompressor.compress(album),
    ]),
    ...data.tracks.map((track) => [
      StorageKey.trackKey(track.id),
      trackDataCompressor.compress(track),
    ]),
  ]);
}

/** Compatibility for callers that still consume compressed factory inputs. */
export const musicStorage = {
  async get(keys: readonly string[]): Promise<StorableData> {
    const groups: Record<MusicStore, number[]> = {
      bands: [],
      albums: [],
      tracks: [],
    };
    for (const key of new Set(keys)) {
      const store = StorageKey.isBandKey(key)
        ? 'bands'
        : StorageKey.isAlbumKey(key)
          ? 'albums'
          : StorageKey.isTrackKey(key)
            ? 'tracks'
            : undefined;
      if (store) {
        const id = Number(key.slice(3));
        if (Number.isSafeInteger(id) && id >= 0) groups[store].push(id);
      }
    }
    const batches = await Promise.all(
      (Object.entries(groups) as [MusicStore, number[]][])
        .filter(([, ids]) => ids.length)
        .map(([store, ids]) =>
          requestMusicLibrary({ action: 'read', store, ids }),
        ),
    );
    const result: StorableData = Object.assign(
      {},
      ...batches.map(storableData),
    );
    return result;
  },
  async getAllBands(): Promise<StorableData> {
    return storableData(
      await requestMusicLibrary({ action: 'read', store: 'bands' }),
    );
  },
};
