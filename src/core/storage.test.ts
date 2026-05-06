import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  rstest,
} from '@rstest/core';
import { type StorableData, Storage } from './storage';

describe('Storage', () => {
  const originalChrome = globalThis.chrome;
  let storageArea: ReturnType<typeof createStorageArea>;
  let storage: Storage;

  beforeEach(() => {
    storageArea = createStorageArea({
      enabled: true,
      name: 'Bandcamp',
    });
    storage = new Storage(storageArea as unknown as chrome.storage.StorageArea);
    setChromeLastError(undefined);
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'chrome', {
      value: originalChrome,
      configurable: true,
    });
  });

  it('returns an empty object when no keys are requested', async () => {
    await expect(storage.get([])).resolves.toEqual({});
    expect(storageArea.get).not.toHaveBeenCalled();
  });

  it('deduplicates requested keys and returns matching data', async () => {
    await expect(
      storage.get(['enabled', 'enabled', 'missing']),
    ).resolves.toEqual({
      enabled: true,
      missing: undefined,
    });

    expect(storageArea.get).toHaveBeenCalledWith(['enabled', 'missing']);
  });

  it('reads typed values by key and normalizes booleans', async () => {
    await storage.setByKey('flag', 1);

    await expect(storage.getByKey<number>('flag')).resolves.toBe(1);
    await expect(storage.getBooleanByKey('flag')).resolves.toBe(true);
    await expect(storage.getBooleanByKey('missing')).resolves.toBeUndefined();
  });

  it('sets keyed data and storable data objects', async () => {
    await storage.set('album', { title: 'Moon Safari' });
    await storage.set(createStorableData({ artist: { name: 'Air' } }));

    await expect(storage.getAll()).resolves.toEqual({
      enabled: true,
      name: 'Bandcamp',
      album: { title: 'Moon Safari' },
      artist: { name: 'Air' },
    });
  });

  it('requires data when setting by string key', async () => {
    await expect(storage.set('album')).rejects.toThrow(
      'Data parameter is required when key is a string',
    );
  });

  it('lists, counts, removes, clears, and measures storage', async () => {
    await storage.setByKey('album', { title: 'Moon Safari' });
    await storage.remove('name');

    await expect(storage.getKeys()).resolves.toEqual(['enabled', 'album']);
    await expect(storage.count()).resolves.toBe(2);
    await expect(storage.getSize()).resolves.toBe(256);

    await storage.clear();
    await expect(storage.getAll()).resolves.toEqual({});
  });
});

function setChromeLastError(lastError?: chrome.runtime.LastError) {
  Object.defineProperty(globalThis, 'chrome', {
    value: {
      runtime: { lastError },
    },
    configurable: true,
  });
}

function createStorageArea(initial: StorableData = {}) {
  let data: StorableData = { ...initial };

  return {
    get: rstest.fn((keys?: string | string[] | null, callback?: Function) => {
      const result = selectData(data, keys);

      if (callback) {
        callback(result);
        return undefined;
      }

      return Promise.resolve(result);
    }),
    set: rstest.fn((items: StorableData, callback?: Function) => {
      data = { ...data, ...items };
      callback?.();
      return Promise.resolve();
    }),
    remove: rstest.fn((keys: string | string[], callback?: Function) => {
      const keysToRemove = Array.isArray(keys) ? keys : [keys];
      keysToRemove.forEach((key) => {
        delete data[key];
      });
      callback?.();
      return Promise.resolve();
    }),
    clear: rstest.fn(() => {
      data = {};
      return Promise.resolve();
    }),
    getKeys: rstest.fn(() => Promise.resolve(Object.keys(data))),
    getBytesInUse: rstest.fn(
      (_keys: null, callback: (size: number) => void) => {
        callback(256);
      },
    ),
  };
}

function selectData(data: StorableData, keys?: string | string[] | null) {
  if (keys === null || keys === undefined) {
    return { ...data };
  }

  if (typeof keys === 'string') {
    return { [keys]: data[keys] };
  }

  return keys.reduce<StorableData>((result, key) => {
    result[key] = data[key];
    return result;
  }, {});
}

function createStorableData(data: StorableData) {
  return {
    toStorableData: () => data,
  };
}
