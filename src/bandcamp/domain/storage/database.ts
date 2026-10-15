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
    request.onupgradeneeded = () => {
      // Fresh databases only; existing installations must recreate the database.
      const db = request.result;
      const bands = db.createObjectStore('bands', { keyPath: 'data.id' });
      bands.createIndex('nameKey', 'keys.name');
      bands.createIndex('savedOrder', 'storage.savedOrder');
      const albums = db.createObjectStore('albums', { keyPath: 'data.id' });
      albums.createIndex('bandId', 'data.bandId');
      albums.createIndex('artistKeys', 'keys.artists', { multiEntry: true });
      albums.createIndex('titleArtist', ['keys.title', 'keys.artistCredit']);
      albums.createIndex('savedOrder', 'storage.savedOrder');
      const tracks = db.createObjectStore('tracks', { keyPath: 'data.id' });
      tracks.createIndex('albumId', 'data.albumId');
      tracks.createIndex('savedOrder', 'storage.savedOrder');
      const refs = db.createObjectStore('urlRefs', { keyPath: 'uuid' });
      refs.createIndex('entity', ['store', 'id']);
      db.createObjectStore('meta', { keyPath: 'key' });
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
      for (const name of Object.values(FAN_DATASET_STORES)) {
        const memberships = db.createObjectStore(name, {
          keyPath: ['fanId', 'entityKey'],
        });
        memberships.createIndex('account', 'fanId');
        memberships.createIndex('current', ['fanId', 'current']);
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
