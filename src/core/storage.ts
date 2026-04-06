import { arrayUnique } from 'src/utils/array';
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
  constructor(
    private storage: chrome.storage.StorageArea,
    private debug = false,
  ) {}

  async get<T extends StorageDataMap = StorageDataMap>(
    keys: readonly string[],
  ): Promise<Partial<T>> {
    if (keys.length === 0) {
      return {};
    }

    const uniqueKeys = arrayUnique(keys as string[]);
    const logLabel = `[Storage.get(keys: ${uniqueKeys.length})]`;

    if (this.debug) {
      console.time(logLabel);
    }

    try {
      const items = await this.storage.get(uniqueKeys);

      if (this.debug) {
        console.timeEnd(logLabel);
        console.log(logLabel, ...arrayPreview(uniqueKeys as string[]), items);
      }

      return items as Partial<T>;
    } catch (error) {
      if (this.debug) {
        console.timeEnd(logLabel);
      }

      throw error;
    }
  }

  async getByKey<T = unknown>(key: string): Promise<T | undefined> {
    const t0 = performance.now();
    const items = await this.storage.get(key);
    const t1 = performance.now();
    const data = items[key] as T | undefined;
    console.log(`[Storage.getByKey(${key})]:`, t1 - t0, 'ms');
    return data;
  }

  async getKeys(): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      const logLabel = `[Storage.getKeys]`;
      console.time(logLabel);

      this.storage.getKeys().then((keys) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }

        console.log(logLabel, ...arrayPreview(keys));
        console.timeEnd(logLabel);

        resolve(keys);
      });
    });
  }

  async getAll(): Promise<StorageDataMap> {
    return new Promise<StorageDataMap>((resolve, reject) => {
      const logLabel = `[Storage.getAll]`;
      console.time(logLabel);

      this.storage.get(null, (items) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }

        console.log(logLabel, ...arrayPreview(Object.keys(items)));
        console.timeEnd(logLabel);

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
      const logLabel = `[Storage.set(${Object.keys(storableData).length})]`;
      console.time(logLabel);

      this.storage.set(storableData, () => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }

        console.log(logLabel, storableData);
        console.timeEnd(logLabel);

        resolve();
      });
    });
  }

  async setByKey(key: string, value: any): Promise<void> {
    return this.set({ [key]: value });
  }

  async clear(): Promise<void> {
    return this.storage.clear();
  }

  async remove(key: string | string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const logLabel = `[Storage.remove(${Array.isArray(key) ? key.length : key})]`;
      console.time(logLabel);

      this.storage.remove(key, () => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }

        console.log(
          logLabel,
          ...arrayPreview(Array.isArray(key) ? key : [key]),
        );
        console.timeEnd(logLabel);
        resolve();
      });
    });
  }

  async count(): Promise<number> {
    return new Promise((resolve, reject) => {
      const logLabel = `[Storage.count]`;
      console.time(logLabel);

      this.getAll().then((items) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }

        const count = Object.keys(items).length;
        console.log('[Storage.count]', count);
        console.timeEnd(logLabel);

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
