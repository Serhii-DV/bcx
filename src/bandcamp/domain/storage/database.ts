const DATABASE_NAME = 'bcx-library';
export const DATABASE_STORES = [
  'bands',
  'albums',
  'tracks',
  'urlRefs',
  'meta',
  'fanAccounts',
  'fanLists',
  'fanMemberships',
  'fanAvailability',
] as const;
let connection: Promise<IDBDatabase> | undefined;

export function openDatabase(): Promise<IDBDatabase> {
  if (connection) return connection;
  const pending = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 2);
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
        const memberships = db.createObjectStore('fanMemberships', {
          keyPath: ['fanId', 'dataset', 'entityKey'],
        });
        memberships.createIndex('list', ['fanId', 'dataset']);
        memberships.createIndex('current', ['fanId', 'dataset', 'current']);
        const availability = db.createObjectStore('fanAvailability', {
          keyPath: ['fanId', 'entityKey'],
        });
        availability.createIndex('account', 'fanId');
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
