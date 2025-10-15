import { arrayPreview, console } from 'src/utils/console';

export interface StorageObject {
  [key: string]: any;
}

export interface StorableData {
  // must be `any` because values can be either StorageObject or string (key reference)
  [key: string]: any;
}

export interface StorableObject {
  toStorageObject(): StorageObject;
}

export interface StorableObjectConstructor<T> {
  new (...args: any[]): T;
  fromStorageObject(data: StorageObject): T;
}

export interface Storable extends StorableObject {
  toStorableData(): StorableData;
}

export type StorageDataMap = StorableData;

export class Storage {
  private storage: chrome.storage.StorageArea;

  constructor(storage: chrome.storage.StorageArea = chrome.storage.local) {
    this.storage = storage;
  }

  async get(keys: string[]): Promise<StorageDataMap> {
    return new Promise((resolve, reject) => {
      this.storage.get(keys, (items) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }

        console.log('[Storage.get]', ...arrayPreview(keys));
        resolve(items);
      });
    });
  }

  async getByKey<T = any>(key: string): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.storage.get([key], (items) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }

        console.log('[Storage.getByKey]', key);
        resolve(items[key] as T | undefined);
      });
    });
  }

  async getAll(): Promise<StorageDataMap> {
    return new Promise<StorageDataMap>((resolve, reject) => {
      this.storage.get(null, (items) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }

        console.log('[Storage.getAll]', ...arrayPreview(Object.keys(items)));
        resolve(items);
      });
    });
  }

  async set(
    key: string | StorableData | Storable,
    data?: StorageObject,
  ): Promise<void> {
    let storableData: StorableData;

    if (typeof key === 'string') {
      if (data === undefined) {
        throw new Error('Data parameter is required when key is a string');
      }
      storableData = { [key]: data };
    } else if ('toStorableData' in key) {
      storableData = (key as Storable).toStorableData();
    } else {
      storableData = key as StorableData;
    }

    return new Promise((resolve, reject) => {
      this.storage.set(storableData, () => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }

        console.log('[Storage.set]', storableData);
        resolve();
      });
    });
  }

  async clear(): Promise<void> {
    return this.storage.clear();
  }

  async remove(key: string | string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.storage.remove(key, () => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }

        console.log('[Storage.remove]', ...arrayPreview(key as string[]));
        resolve();
      });
    });
  }

  async count(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.getAll().then((items) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }

        const count = Object.keys(items).length;
        console.log('[Storage.count]', count);
        resolve(count);
      });
    });
  }

  async getSize(): Promise<number> {
    const storage = this.storage;

    return new Promise((resolve, reject) => {
      if (typeof storage.getBytesInUse === 'function') {
        // Chrome supports getBytesInUse
        storage.getBytesInUse(null, (bytesInUse) => {
          if (chrome.runtime.lastError) {
            return reject(chrome.runtime.lastError);
          }

          console.log('[Storage.getSize]', bytesInUse);
          resolve(bytesInUse);
        });
      } else {
        // Fallback for Firefox
        storage.get(null, (items) => {
          const bytesInUse = Object.values(items).reduce((total, item) => {
            return (
              total +
              (typeof item === 'string'
                ? item.length
                : JSON.stringify(item).length)
            );
          }, 0);

          console.log('[Storage.getSize]', bytesInUse);
          resolve(bytesInUse);
        });
      }
    });
  }
}
