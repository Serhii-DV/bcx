import type { FanDataset } from '../fanData/data';

const DATABASE_NAME = 'bcx-library';
export const FAN_DATASET_STORES = {
  collection: 'fanCollection',
  wishlist: 'fanWishlist',
  'following-bands': 'fanFollowingBands',
  'following-genres': 'fanFollowingGenres',
} as const satisfies Record<FanDataset, string>;
export const DATABASE_STORES = [
  'bands',
  'albums',
  'tracks',
  'urlRefs',
  'meta',
  'fanAccounts',
  'fanLists',
  ...Object.values(FAN_DATASET_STORES),
  'fanAvailability',
] as const;
let connection: Promise<IDBDatabase> | undefined;

export function openDatabase(): Promise<IDBDatabase> {
  if (connection) return connection;
  const pending = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 4);
    let blocked = false;
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (event.oldVersion < 1) {
        const bands = db.createObjectStore('bands', { keyPath: 'id' });
        bands.createIndex('nameKey', 'nameKey');
        bands.createIndex('savedOrder', 'savedOrder');
        const albums = db.createObjectStore('albums', { keyPath: 'id' });
        albums.createIndex('bandId', 'bandId');
        albums.createIndex('artistKeys', 'artistKeys', { multiEntry: true });
        albums.createIndex('titleArtist', ['titleKey', 'artistCreditKey']);
        albums.createIndex('savedOrder', 'savedOrder');
        const tracks = db.createObjectStore('tracks', { keyPath: 'id' });
        tracks.createIndex('albumId', 'albumId');
        tracks.createIndex('savedOrder', 'savedOrder');
        const refs = db.createObjectStore('urlRefs', { keyPath: 'uuid' });
        refs.createIndex('entity', ['store', 'id']);
        db.createObjectStore('meta', { keyPath: 'key' });
      }
      if (event.oldVersion < 2) {
        db.createObjectStore('fanAccounts', { keyPath: 'fanId' });
        const lists = db.createObjectStore('fanLists', {
          keyPath: ['fanId', 'dataset'],
        });
        lists.createIndex('account', 'fanId');
        lists.createIndex('datasetOrder', ['dataset', 'updatedOrder']);
        const availability = db.createObjectStore('fanAvailability', {
          keyPath: ['fanId', 'entityKey'],
        });
        availability.createIndex('account', 'fanId');
      }
      if (event.oldVersion < 3) {
        for (const name of Object.values(FAN_DATASET_STORES)) {
          const memberships = db.createObjectStore(name, {
            keyPath: ['fanId', 'entityKey'],
          });
          memberships.createIndex('account', 'fanId');
          memberships.createIndex('current', ['fanId', 'current']);
        }
        if (db.objectStoreNames.contains('fanMemberships')) {
          // No migration: discard legacy memberships and their stale list summaries.
          db.deleteObjectStore('fanMemberships');
          const upgrade = request.transaction;
          if (!upgrade)
            throw new Error('Missing database upgrade transaction.');
          upgrade.objectStore('fanLists').clear();
          upgrade.objectStore('meta').put({
            key: 'fan-state',
            revision: crypto.randomUUID(),
            nextOrder: 0,
          });
        }
      }
      if (event.oldVersion > 0 && event.oldVersion < 4) {
        // The key format changed; start these lists fresh without migrating records.
        const upgrade = request.transaction;
        if (!upgrade) throw new Error('Missing database upgrade transaction.');
        upgrade.objectStore('fanFollowingBands').clear();
        upgrade.objectStore('fanFollowingGenres').clear();
        const lists = upgrade.objectStore('fanLists').openCursor();
        lists.onsuccess = () => {
          const cursor = lists.result;
          if (!cursor) return;
          if (
            cursor.value.dataset === 'following-bands' ||
            cursor.value.dataset === 'following-genres'
          )
            cursor.delete();
          cursor.continue();
        };
        const availability = upgrade
          .objectStore('fanAvailability')
          .openCursor();
        availability.onsuccess = () => {
          const cursor = availability.result;
          if (!cursor) return;
          if (cursor.value.entityKey.startsWith('band:')) cursor.delete();
          cursor.continue();
        };
        const state = upgrade.objectStore('meta').get('fan-state');
        state.onsuccess = () => {
          if (state.result)
            upgrade.objectStore('meta').put({
              ...state.result,
              revision: crypto.randomUUID(),
            });
        };
      }
    };
    request.onblocked = () => {
      blocked = true;
      reject(
        new Error(
          'Music library upgrade is blocked. Close other BCX views and retry.',
        ),
      );
    };
    request.onerror = () =>
      reject(request.error ?? new Error('Could not open music library.'));
    request.onsuccess = () => {
      const db = request.result;
      if (blocked) {
        db.close();
        return;
      }
      db.onversionchange = () => {
        db.close();
        connection = undefined;
      };
      db.onclose = () => {
        connection = undefined;
      };
      resolve(db);
    };
  });
  connection = pending;
  void pending.catch(() => {
    if (connection === pending) connection = undefined;
  });
  return pending;
}

export function readRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Music library request failed.'));
  });
}
export function completed(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(
        transaction.error ?? new Error('Music library transaction aborted.'),
      );
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('Could not save music library.'));
  });
}
