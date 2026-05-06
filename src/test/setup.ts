const storageArea = createStorageArea();

process.env.NODE_ENV = 'test';

if (!globalThis.chrome) {
  Object.defineProperty(globalThis, 'chrome', {
    value: {
      runtime: {
        id: 'test-extension',
        lastError: undefined,
        sendMessage: () => Promise.resolve(),
        getURL: (path: string) => `chrome-extension://test-extension/${path}`,
      },
      storage: {
        local: storageArea,
        session: createStorageArea(),
      },
    },
    configurable: true,
  });
}

function createStorageArea() {
  let data: Record<string, unknown> = {};

  return {
    get(keys?: string | string[] | null, callback?: Function) {
      const result = selectData(data, keys);
      if (callback) {
        callback(result);
        return undefined;
      }
      return Promise.resolve(result);
    },
    set(items: Record<string, unknown>, callback?: Function) {
      data = { ...data, ...items };
      callback?.();
      return Promise.resolve();
    },
    remove(keys: string | string[], callback?: Function) {
      const keysToRemove = Array.isArray(keys) ? keys : [keys];
      keysToRemove.forEach((key) => {
        delete data[key];
      });
      callback?.();
      return Promise.resolve();
    },
    clear() {
      data = {};
      return Promise.resolve();
    },
    getKeys() {
      return Promise.resolve(Object.keys(data));
    },
    getBytesInUse(_keys: null, callback: (size: number) => void) {
      callback(JSON.stringify(data).length);
    },
  };
}

function selectData(
  data: Record<string, unknown>,
  keys?: string | string[] | null,
) {
  if (keys === null || keys === undefined) {
    return { ...data };
  }

  if (typeof keys === 'string') {
    return { [keys]: data[keys] };
  }

  return keys.reduce<Record<string, unknown>>((result, key) => {
    result[key] = data[key];
    return result;
  }, {});
}
