export interface StorageData {
  [key: string]: any;
}

export type StorageDataMap = StorageData;

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

        console.log('[Storage] Get by keys', keys);
        resolve(items);
      });
    });
  }

  async getAll(): Promise<StorageDataMap> {
    return new Promise<StorageDataMap>((resolve, reject) => {
      this.storage.get(null, (items) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }

        console.log('[Storage] Get all');
        resolve(items);
      });
    });
  }

  async set(key: string, data: StorageData): Promise<void> {
    return new Promise((resolve, reject) => {
      this.storage.set({ [key]: data }, () => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }

        console.log('[Storage] Set by key', key, data);
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

        console.log('[Storage] Remove key(s)', key);
        resolve();
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

          console.log('[Storage] Size', bytesInUse);
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

          console.log('[Storage] Size', bytesInUse);
          resolve(bytesInUse);
        });
      }
    });
  }

  toConsoleLog() {
    this.getAll().then((data) => console.log('[Storage] Data', data));
  }
}
