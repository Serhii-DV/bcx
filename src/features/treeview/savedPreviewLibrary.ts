import type { RawAlbumData } from 'src/bandcamp/domain/album/compressor';
import { Artist } from 'src/bandcamp/domain/artist/artist';
import type { CompressedBandData } from 'src/bandcamp/domain/band/compressor';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { StorageKey } from 'src/bandcamp/domain/storageKey';
import { storage } from 'src/core/shared';

type ReleaseLinkData = Pick<RawAlbumData, 'url' | 'artworkId'>;
interface ReleaseIndex {
  byTitle: Map<string, ReleaseLinkData[]>;
  byArtist: Map<string, number[]>;
  order: Map<number, number>;
}
interface PreviewLibrary {
  keys?: Promise<string[]>;
  releases?: Promise<ReleaseIndex>;
  bands?: Promise<CompressedBandData[]>;
}

let library: PreviewLibrary = {};
const listeners = new Set<() => void>();
let notificationTimer: ReturnType<typeof setTimeout> | undefined;
const normalize = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLowerCase();

function releaseKey(title: string, artist: string): string {
  return JSON.stringify([normalize(title), normalize(artist)]);
}

function getKeys(current: PreviewLibrary): Promise<string[]> {
  if (!current.keys) {
    const pending = storage.getKeys().catch((error: unknown) => {
      if (current.keys === pending) current.keys = undefined;
      throw error;
    });
    current.keys = pending;
  }
  return current.keys;
}

async function getReleaseIndex(): Promise<ReleaseIndex> {
  const current: PreviewLibrary = listeners.size ? library : {};
  if (!current.releases) {
    const pending = getKeys(current)
      .then((keys) => BandcampStorage.getAllAlbumsRawData(keys))
      .then((albums) => {
        const byTitle = new Map<string, ReleaseLinkData[]>();
        const byArtist = new Map<string, number[]>();
        const order = new Map<number, number>();
        for (const album of albums) {
          order.set(album.id, order.size);
          const key = releaseKey(album.title, album.artist);
          const matches = byTitle.get(key) ?? [];
          matches.push({ url: album.url, artworkId: album.artworkId });
          byTitle.set(key, matches);
          const artists = new Set(
            [album.artist, ...Artist.parse(album.artist).names].map(normalize),
          );
          for (const artist of artists) {
            const ids = byArtist.get(artist) ?? [];
            ids.push(album.id);
            byArtist.set(artist, ids);
          }
        }
        return { byTitle, byArtist, order };
      })
      .catch((error: unknown) => {
        if (current.releases === pending) current.releases = undefined;
        throw error;
      });
    current.releases = pending;
  }
  return current.releases;
}

export async function getSavedPreviewReleases(
  title: string,
  artist: string,
): Promise<ReleaseLinkData[]> {
  return (await getReleaseIndex()).byTitle.get(releaseKey(title, artist)) ?? [];
}

export async function getSavedArtistReleases(
  artists: readonly string[],
): Promise<RawAlbumData[]> {
  if (!artists.length) return [];
  const index = await getReleaseIndex();
  const ids = [
    ...new Set(
      artists.flatMap((artist) => index.byArtist.get(normalize(artist)) ?? []),
    ),
  ];
  ids.sort((a, b) => (index.order.get(a) ?? 0) - (index.order.get(b) ?? 0));
  const albums = await BandcampStorage.getAlbumsRawDataByIds(ids);
  const byId = new Map(albums.map((album) => [album.id, album]));
  return ids.flatMap((id) => {
    const album = byId.get(id);
    return album ? [album] : [];
  });
}

export function getSavedPreviewBands(): Promise<CompressedBandData[]> {
  const current: PreviewLibrary = listeners.size ? library : {};
  if (!current.bands) {
    const pending = getKeys(current)
      .then((keys) => BandcampStorage.getAllCompressedBandData(keys))
      .catch((error: unknown) => {
        if (current.bands === pending) current.bands = undefined;
        throw error;
      });
    current.bands = pending;
  }
  return current.bands;
}

function onStorageChanged(
  changes: Record<string, chrome.storage.StorageChange>,
  area: string,
): void {
  if (area !== 'local') return;
  const keys = Object.keys(changes);
  const albumsChanged = keys.some(StorageKey.isAlbumKey);
  const bandsChanged = keys.some(StorageKey.isBandKey);
  if (albumsChanged || bandsChanged) library.keys = undefined;
  if (albumsChanged) library.releases = undefined;
  if (bandsChanged) library.bands = undefined;
  if (
    (albumsChanged || bandsChanged || keys.includes('/following-bands')) &&
    notificationTimer === undefined
  ) {
    notificationTimer = setTimeout(() => {
      notificationTimer = undefined;
      for (const listener of listeners) listener();
    }, 100);
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
      clearTimeout(notificationTimer);
      notificationTimer = undefined;
    }
  };
}
