import { v5 as uuid5 } from 'uuid';
import type { RawAlbumData } from '../album/data';
import { Artist } from '../artist/artist';
import type { RawBandData } from '../band/data';
import type { RawTrackData } from '../track/data';
import {
  completed,
  DATABASE_STORES,
  openDatabase,
  readRequest,
} from './database';
import {
  isMusicLibraryRequest,
  MUSIC_LIBRARY_REVISION_KEY,
  type MusicBatch,
  type MusicLibraryData,
  type MusicLibraryRequest,
  type MusicStore,
  normalizeMusicName,
} from './musicLibraryProtocol';

const STORES = ['bands', 'albums', 'tracks', 'urlRefs', 'meta'] as const;
type Entity = RawBandData | RawAlbumData | RawTrackData;
interface SavedEntity<T extends Entity = Entity> {
  data: T;
  keys: {
    name?: string;
    artists?: string[];
    title?: string;
    artistCredit?: string;
  };
  storage: {
    savedAt: number;
    savedOrder: number;
  };
}
interface MusicReference {
  uuid: string;
  store: MusicStore;
  id: number;
}
interface LibraryState {
  key: 'state';
  revision: string;
  nextOrder: number;
}
function emptyData(): MusicLibraryData {
  return { bands: [], albums: [], tracks: [], revision: '' };
}
function canonicalUrl(url: string, store: MusicStore): string {
  const parsed = new URL(url);
  parsed.hash = '';
  parsed.search = '';
  if (store === 'bands') parsed.pathname = '/';
  return parsed.href;
}

// Missing fields in catalog summaries must not erase detailed page metadata.
function mergeFields(previous: unknown, incoming: unknown): unknown {
  if (incoming === undefined || incoming === null || incoming === '')
    return previous ?? incoming;
  if (Array.isArray(incoming))
    return incoming.length ? incoming : (previous ?? incoming);
  if (incoming && typeof incoming === 'object' && !Array.isArray(incoming)) {
    const result: Record<string, unknown> =
      previous && typeof previous === 'object' && !Array.isArray(previous)
        ? { ...previous }
        : {};
    for (const [key, value] of Object.entries(incoming))
      result[key] = mergeFields(result[key], value);
    return result;
  }
  return incoming;
}

export async function publishMusicRevision(revision: string): Promise<void> {
  try {
    await chrome.storage.session.set({
      [MUSIC_LIBRARY_REVISION_KEY]: revision,
    });
  } catch (error) {
    console.warn(
      'Music library saved, but its change notification failed:',
      error,
    );
  }
}

export async function saveMusicBatch(
  transaction: IDBTransaction,
  batch: MusicBatch,
  { preserveExisting = false }: { preserveExisting?: boolean } = {},
): Promise<string> {
  const meta = transaction.objectStore('meta');
  const state: LibraryState = (await readRequest<LibraryState | undefined>(
    meta.get('state'),
  )) ?? { key: 'state', revision: '', nextOrder: 0 };
  for (const store of ['bands', 'albums', 'tracks'] as const) {
    for (const incoming of batch[store] ?? []) {
      const objectStore = transaction.objectStore(store);
      const previous = await readRequest<SavedEntity | undefined>(
        objectStore.get(incoming.id),
      );
      const detailed =
        previous &&
        'artist' in previous.data &&
        previous.data.metadata?.published &&
        (!('metadata' in incoming) || !incoming.metadata);
      const data = (
        detailed || preserveExisting
          ? mergeFields(incoming, previous?.data)
          : mergeFields(previous?.data, incoming)
      ) as Entity;
      // List summaries can refresh a known price without replacing page details.
      if (
        preserveExisting &&
        'artist' in incoming &&
        incoming.metadata &&
        'artist' in data &&
        data.metadata
      ) {
        data.metadata.price = incoming.metadata.price;
        if (data.metadata.release?.minimumPrice !== undefined)
          data.metadata.release.minimumPrice = incoming.metadata.price.amount;
      }
      if (
        'name' in incoming &&
        'name' in data &&
        incoming.metadata.releases !== undefined
      ) {
        // A scanned catalog is authoritative, including a genuinely empty page.
        data.metadata.releases = incoming.metadata.releases;
      }
      const record: SavedEntity = {
        data,
        keys: {},
        storage: {
          savedAt: Date.now(),
          savedOrder: previous?.storage.savedOrder ?? state.nextOrder++,
        },
      };
      if (data.url) data.url = canonicalUrl(data.url, store);
      if (store === 'bands' && 'name' in data)
        record.keys = { name: normalizeMusicName(data.name) };
      if (store === 'albums' && 'artist' in data) {
        record.keys = {
          artists: [
            ...new Set(
              [data.artist, ...Artist.parse(data.artist).names].map(
                normalizeMusicName,
              ),
            ),
          ],
          title: normalizeMusicName(data.title),
          artistCredit: normalizeMusicName(data.artist),
        };
      }
      objectStore.put(record);
      if (data.url) {
        const reference: MusicReference = {
          uuid: uuid5(data.url, uuid5.URL),
          store,
          id: data.id,
        };
        transaction.objectStore('urlRefs').put(reference);
      }
    }
  }
  state.revision = crypto.randomUUID();
  meta.put(state);
  return state.revision;
}

async function write(
  database: IDBDatabase,
  request: Extract<MusicLibraryRequest, { action: 'save' | 'remove-tracks' }>,
): Promise<MusicLibraryData> {
  const transaction = database.transaction([...STORES], 'readwrite');
  const done = completed(transaction);
  try {
    let revision: string;
    if (request.action === 'save') {
      revision = await saveMusicBatch(transaction, request.data);
    } else {
      const meta = transaction.objectStore('meta');
      const state: LibraryState = (await readRequest<LibraryState | undefined>(
        meta.get('state'),
      )) ?? { key: 'state', revision: '', nextOrder: 0 };
      const refs = transaction.objectStore('urlRefs');
      for (const id of request.ids) {
        transaction.objectStore('tracks').delete(id);
        const keys = await readRequest<IDBValidKey[]>(
          refs.index('entity').getAllKeys(['tracks', id]),
        );
        for (const key of keys) refs.delete(key);
      }
      state.revision = crypto.randomUUID();
      meta.put(state);
      revision = state.revision;
    }
    await done;
    await publishMusicRevision(revision);
    return { ...emptyData(), revision };
  } catch (error) {
    try {
      transaction.abort();
    } catch {
      /* The transaction may already have aborted. */
    }
    await done.catch(() => {});
    throw error;
  }
}

export async function handleMusicLibraryRequest(
  value: unknown,
): Promise<MusicLibraryData> {
  if (!isMusicLibraryRequest(value))
    throw new Error('Invalid music library request.');
  const db = await openDatabase();
  if (value.action === 'save' || value.action === 'remove-tracks')
    return write(db, value);
  const transaction = db.transaction([...STORES], 'readonly');
  const done = completed(transaction);
  try {
    const result = emptyData();
    const stateRequest = readRequest<LibraryState | undefined>(
      transaction.objectStore('meta').get('state'),
    );
    if (value.action === 'read') {
      const store = transaction.objectStore(value.store);
      const records = value.ids
        ? await Promise.all(
            [...new Set(value.ids)].map((id) =>
              readRequest<SavedEntity | undefined>(store.get(id)),
            ),
          )
        : await readRequest<SavedEntity[]>(store.index('savedOrder').getAll());
      Object.assign(result, {
        [value.store]: records
          .filter((record) => record !== undefined)
          .map((record) => record.data),
      });
    } else if (value.action === 'lookup') {
      const references = await Promise.all(
        [...new Set(value.uuids)].map((uuid) =>
          readRequest<MusicReference | undefined>(
            transaction.objectStore('urlRefs').get(uuid),
          ),
        ),
      );
      await Promise.all(
        references.map(async (ref) => {
          if (!ref) return;
          const record = await readRequest<SavedEntity | undefined>(
            transaction.objectStore(ref.store).get(ref.id),
          );
          if (
            record &&
            !(result[ref.store] as Entity[]).some(
              (saved) => saved.id === record.data.id,
            )
          )
            (result[ref.store] as Entity[]).push(record.data);
        }),
      );
    } else if (
      value.action === 'find-albums' ||
      value.action === 'match-albums'
    ) {
      const albums = transaction.objectStore('albums');
      const groups =
        value.action === 'find-albums'
          ? await Promise.all(
              [...new Set(value.artists.map(normalizeMusicName))].map((name) =>
                readRequest<SavedEntity<RawAlbumData>[]>(
                  albums.index('artistKeys').getAll(name),
                ),
              ),
            )
          : [
              await readRequest<SavedEntity<RawAlbumData>[]>(
                albums
                  .index('titleArtist')
                  .getAll([
                    normalizeMusicName(value.title),
                    normalizeMusicName(value.artist),
                  ]),
              ),
            ];
      const unique = new Map(
        groups.flat().map((album) => [album.data.id, album]),
      );
      result.albums = [...unique.values()]
        .sort((a, b) => a.storage.savedOrder - b.storage.savedOrder)
        .map((record) => record.data);
    } else if (value.action === 'find-bands') {
      const bands = transaction.objectStore('bands');
      const groups = await Promise.all(
        [...new Set(value.names.map(normalizeMusicName))].map((name) =>
          readRequest<SavedEntity<RawBandData>[]>(
            bands.index('nameKey').getAll(name),
          ),
        ),
      );
      result.bands = groups
        .flat()
        .sort((a, b) => a.storage.savedOrder - b.storage.savedOrder)
        .map((record) => record.data);
    }
    result.revision = (await stateRequest)?.revision ?? '';
    await done;
    return result;
  } catch (error) {
    await done.catch(() => {});
    throw error;
  }
}

export async function measureMusicDatabase() {
  const db = await openDatabase();
  const transaction = db.transaction([...DATABASE_STORES], 'readonly');
  const done = completed(transaction);
  try {
    const counts = await Promise.all(
      DATABASE_STORES.map(async (store) => ({
        label: {
          bands: 'Bands',
          albums: 'Albums',
          tracks: 'Tracks',
          urlRefs: 'URL lookups',
          meta: 'Library metadata',
          fanAccounts: 'Fan accounts',
          fanLists: 'Fan lists',
          fanCollection: 'Collection',
          fanWishlist: 'Wishlist',
          fanFollowingBands: 'Following Bands',
          fanFollowingGenres: 'Following Genres',
          fanAvailability: 'Page availability',
        }[store],
        entries: await readRequest<number>(
          transaction.objectStore(store).count(),
        ),
        bytes: 0,
      })),
    );
    await done;
    const estimate = await navigator.storage.estimate();
    if (estimate.usage === undefined)
      throw new Error('Storage usage estimate is unavailable.');
    return {
      id: 'indexeddb' as const,
      label: 'Music library',
      estimated: true,
      bytes: Math.round(estimate.usage),
      quota: estimate.quota === undefined ? null : Math.round(estimate.quota),
      entries: counts.reduce((sum, store) => sum + store.entries, 0),
      categories: counts,
    };
  } catch (error) {
    await done.catch(() => {});
    throw error;
  }
}
