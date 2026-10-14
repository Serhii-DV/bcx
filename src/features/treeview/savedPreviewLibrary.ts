import type { RawAlbumData } from 'src/bandcamp/domain/album/compressor';
import type { CompressedBandData } from 'src/bandcamp/domain/band/compressor';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { watchMusicLibrary } from 'src/bandcamp/domain/storage/musicLibrary';
import { normalizeMusicName } from 'src/bandcamp/domain/storage/musicLibraryProtocol';

type ReleaseLinkData = Pick<RawAlbumData, 'url' | 'artworkId'>;
interface PreviewLibrary {
  releases: Map<string, Promise<RawAlbumData[]>>;
  bands?: Promise<CompressedBandData[]>;
}
const createLibrary = (): PreviewLibrary => ({ releases: new Map() });
let library = createLibrary();
const listeners = new Set<() => void>();
let notificationTimer: ReturnType<typeof setTimeout> | undefined;
let stopWatchingMusic: (() => void) | undefined;

function getReleases(
  key: string,
  read: () => Promise<RawAlbumData[]>,
): Promise<RawAlbumData[]> {
  const current = listeners.size ? library : createLibrary();
  let pending = current.releases.get(key);
  if (!pending) {
    pending = read().catch((error: unknown) => {
      current.releases.delete(key);
      throw error;
    });
    current.releases.set(key, pending);
  }
  return pending;
}

export async function getSavedPreviewReleases(
  title: string,
  artist: string,
): Promise<ReleaseLinkData[]> {
  const key = JSON.stringify([
    'title',
    normalizeMusicName(title),
    normalizeMusicName(artist),
  ]);
  return (
    await getReleases(key, () =>
      BandcampStorage.findAlbumsByTitleAndArtist(title, artist),
    )
  ).map(({ url, artworkId }) => ({ url, artworkId }));
}

export function getSavedArtistReleases(
  artists: readonly string[],
): Promise<RawAlbumData[]> {
  if (!artists.length) return Promise.resolve([]);
  const key = JSON.stringify([
    'artists',
    ...new Set(artists.map(normalizeMusicName)),
  ]);
  return getReleases(key, () => BandcampStorage.findAlbumsByArtists(artists));
}

export function getSavedPreviewBands(): Promise<CompressedBandData[]> {
  const current = listeners.size ? library : createLibrary();
  if (!current.bands) {
    current.bands = BandcampStorage.getAllCompressedBandData().catch(
      (error: unknown) => {
        current.bands = undefined;
        throw error;
      },
    );
  }
  return current.bands;
}

function notify(): void {
  if (notificationTimer !== undefined) return;
  notificationTimer = setTimeout(() => {
    notificationTimer = undefined;
    for (const listener of listeners) listener();
  }, 100);
}
function musicChanged(): void {
  library = createLibrary();
  notify();
}
function onStorageChanged(
  changes: Record<string, chrome.storage.StorageChange>,
  area: string,
): void {
  if (area === 'local' && '/following-bands' in changes) notify();
}

export function watchSavedPreviewLibrary(onChange: () => void): () => void {
  if (!listeners.size) {
    chrome.storage.onChanged.addListener(onStorageChanged);
    stopWatchingMusic = watchMusicLibrary(musicChanged);
  }
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
    if (!listeners.size) {
      chrome.storage.onChanged.removeListener(onStorageChanged);
      stopWatchingMusic?.();
      stopWatchingMusic = undefined;
      library = createLibrary();
      clearTimeout(notificationTimer);
      notificationTimer = undefined;
    }
  };
}
