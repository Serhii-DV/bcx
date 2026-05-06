import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  rstest,
} from '@rstest/core';

describe('TreeItemCache', () => {
  const originalChrome = globalThis.chrome;
  const originalLocation = window.location.href;
  const sessionStorageArea = createSessionStorageArea();

  beforeEach(() => {
    sessionStorageArea.reset();
    Object.defineProperty(globalThis, 'chrome', {
      value: {
        runtime: { lastError: undefined },
        storage: {
          local: createSessionStorageArea(),
          session: sessionStorageArea,
        },
      },
      configurable: true,
    });
    window.history.replaceState(null, '', originalLocation);
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'chrome', {
      value: originalChrome,
      configurable: true,
    });
  });

  it('creates stable subtree keys while skipping empty parts', async () => {
    const { TreeItemCache } = await import('./TreeItemCache');
    const { sessionStorage } = await import('src/core/shared');

    expect(TreeItemCache.subtreeKey('fan', '', null, undefined, 42)).toBe(
      '/cache/tree-item/fan/42',
    );
    expect((sessionStorage as unknown as { debug: boolean }).debug).toBe(false);
  });

  it('caches tree item snapshots and strips runtime-only handlers', async () => {
    const { TreeItemCache } = await import('./TreeItemCache');
    const createFn = rstest.fn(() =>
      Promise.resolve({
        label: 'Collection',
        onClick: rstest.fn(),
        buttons: [
          { title: 'Open', href: 'https://bandcamp.com' },
          { title: 'Refresh', onClick: rstest.fn() },
        ],
        children: [{ label: 'Moon Safari' }],
      }),
    );

    const first = await TreeItemCache.getOrCreate('tree:collection', createFn);
    const second = await TreeItemCache.getOrCreate('tree:collection', createFn);

    expect(first.label).toBe('Collection');
    expect(second).toEqual({
      label: 'Collection',
      childrenCount: 1,
      buttons: [
        { title: 'Open', icon: undefined, href: 'https://bandcamp.com' },
      ],
      children: [{ label: 'Moon Safari', childrenCount: undefined }],
    });
    expect(second.onClick).toBeUndefined();
    expect(createFn).toHaveBeenCalledTimes(1);
  });

  it('invalidates all tree item cache entries', async () => {
    const { TreeItemCache } = await import('./TreeItemCache');

    await TreeItemCache.set('/cache/tree-item/collection', {
      label: 'Collection',
    });
    await TreeItemCache.set('/cache/tree-item/wishlist', { label: 'Wishlist' });
    await sessionStorageArea.set({ 'unrelated:key': 'keep' });

    await TreeItemCache.invalidateAll();

    await expect(sessionStorageArea.get(null)).resolves.toEqual({
      'unrelated:key': 'keep',
    });
  });
});

function createSessionStorageArea() {
  let data: Record<string, unknown> = {};

  return {
    reset() {
      data = {};
    },
    get: rstest.fn((keys?: string | string[] | null, callback?: Function) => {
      const result = selectData(data, keys);
      if (callback) {
        callback(result);
        return undefined;
      }

      return Promise.resolve(result);
    }),
    set: rstest.fn((items: Record<string, unknown>, callback?: Function) => {
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
