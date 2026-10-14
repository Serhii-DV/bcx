import { v5 as uuid5 } from 'uuid';
import type { RawAlbumData } from '../album/compressor';
import { Artist } from '../artist/artist';
import type { RawBandData } from '../band/compressor';
import type { RawTrackData } from '../track/compressor';
import {
  completed,
  DATABASE_STORES,
  openDatabase,
  readRequest,
} from './database';
import {
  isMusicLibraryRequest,
  MUSIC_LIBRARY_REVISION_KEY,
  type MusicLibraryData,
  type MusicLibraryRequest,
  type MusicStore,
  normalizeMusicName,
} from './musicLibraryProtocol';

const STORES = ['bands', 'albums', 'tracks', 'urlRefs', 'meta'] as const;
type Entity = RawBandData | RawAlbumData | RawTrackData;
type SavedEntity = Entity & { savedAt: number; savedOrder: number };
interface MusicReference {
  uuid: string;
  store: MusicStore;
  id: number;
  url: string;
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

async function publishRevision(revision: string): Promise<void> {
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

async function write(
  database: IDBDatabase,
  request: Extract<MusicLibraryRequest, { action: 'save' | 'remove-tracks' }>,
): Promise<MusicLibraryData> {
  const transaction = database.transaction([...STORES], 'readwrite');
  const done = completed(transaction);
  try {
    const meta = transaction.objectStore('meta');
    const state: LibraryState = (await readRequest<LibraryState | undefined>(
      meta.get('state'),
    )) ?? { key: 'state', revision: '', nextOrder: 0 };
    if (request.action === 'save') {
      for (const store of ['bands', 'albums', 'tracks'] as const) {
        for (const incoming of request.data[store] ?? []) {
          const objectStore = transaction.objectStore(store);
          const previous = await readRequest<SavedEntity | undefined>(
            objectStore.get(incoming.id),
          );
          const detailed =
            previous &&
            'artist' in previous &&
            previous.metadata &&
            (!('metadata' in incoming) || !incoming.metadata);
          const merged = (
            detailed
              ? mergeFields(incoming, previous)
              : mergeFields(previous, incoming)
          ) as Entity;
          const record = {
            ...merged,
            savedAt: Date.now(),
            savedOrder: previous?.savedOrder ?? state.nextOrder++,
          };
          if ('url' in record && record.url)
            record.url = canonicalUrl(record.url, store);
          if (store === 'bands' && 'name' in record)
            Object.assign(record, { nameKey: normalizeMusicName(record.name) });
          if (store === 'albums' && 'artist' in record) {
            Object.assign(record, {
              artistKeys: [
                ...new Set(
                  [record.artist, ...Artist.parse(record.artist).names].map(
                    normalizeMusicName,
                  ),
                ),
              ],
              titleKey: normalizeMusicName(record.title),
              artistCreditKey: normalizeMusicName(record.artist),
            });
          }
          objectStore.put(record);
          if (record.url) {
            const reference: MusicReference = {
              uuid: uuid5(record.url, uuid5.URL),
              store,
              id: record.id,
              url: record.url,
            };
            transaction.objectStore('urlRefs').put(reference);
          }
        }
      }
    } else {
      const refs = transaction.objectStore('urlRefs');
      for (const id of request.ids) {
        transaction.objectStore('tracks').delete(id);
        const keys = await readRequest<IDBValidKey[]>(
          refs.index('entity').getAllKeys(['tracks', id]),
        );
        for (const key of keys) refs.delete(key);
      }
    }
    state.revision = crypto.randomUUID();
    meta.put(state);
    await done;
    await publishRevision(state.revision);
    return { ...emptyData(), revision: state.revision };
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
              readRequest<Entity | undefined>(store.get(id)),
            ),
          )
        : await readRequest<SavedEntity[]>(store.index('savedOrder').getAll());
      Object.assign(result, {
        [value.store]: records.filter((record) => record !== undefined),
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
          const record = await readRequest<Entity | undefined>(
            transaction.objectStore(ref.store).get(ref.id),
          );
          if (
            record &&
            !(result[ref.store] as Entity[]).some(
              (saved) => saved.id === record.id,
            )
          )
            (result[ref.store] as Entity[]).push(record);
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
                readRequest<SavedEntity[]>(
                  albums.index('artistKeys').getAll(name),
                ),
              ),
            )
          : [
              await readRequest<SavedEntity[]>(
                albums
                  .index('titleArtist')
                  .getAll([
                    normalizeMusicName(value.title),
                    normalizeMusicName(value.artist),
                  ]),
              ),
            ];
      const unique = new Map(groups.flat().map((album) => [album.id, album]));
      result.albums = [...unique.values()].sort(
        (a, b) => a.savedOrder - b.savedOrder,
      ) as RawAlbumData[];
    } else if (value.action === 'find-bands') {
      const bands = transaction.objectStore('bands');
      const groups = await Promise.all(
        [...new Set(value.names.map(normalizeMusicName))].map((name) =>
          readRequest<SavedEntity[]>(bands.index('nameKey').getAll(name)),
        ),
      );
      result.bands = groups
        .flat()
        .sort((a, b) => a.savedOrder - b.savedOrder) as RawBandData[];
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
          fanMemberships: 'List memberships',
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
