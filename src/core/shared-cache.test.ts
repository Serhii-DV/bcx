import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  rstest,
} from '@rstest/core';
import { SharedCache } from './shared-cache';

describe('SharedCache', () => {
  const originalChrome = globalThis.chrome;
  let sessionStorage: ReturnType<typeof createSessionStorage>;

  beforeEach(() => {
    sessionStorage = createSessionStorage({
      'tree:album': { title: 'Moon Safari' },
      'other:album': { title: 'Other' },
    });
    Object.defineProperty(globalThis, 'chrome', {
      value: {
        storage: {
          session: sessionStorage,
        },
      },
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'chrome', {
      value: originalChrome,
      configurable: true,
    });
  });

  it('reads and writes values under the configured prefix', async () => {
    const cache = new SharedCache<'artist', { name: string }>('tree');

    await cache.set('artist', { name: 'Air' });

    expect(sessionStorage.set).toHaveBeenCalledWith({
      'tree:artist': { name: 'Air' },
    });
    await expect(cache.get('artist')).resolves.toEqual({ name: 'Air' });
  });

  it('clears only entries that belong to its prefix', async () => {
    const cache = new SharedCache<string, unknown>('tree');

    await cache.clear();

    expect(sessionStorage.remove).toHaveBeenCalledWith(['tree:album']);
    await expect(sessionStorage.get()).resolves.toEqual({
      'other:album': { title: 'Other' },
    });
  });

  it('swallows storage failures and returns undefined for failed reads', async () => {
    const warn = rstest.spyOn(console, 'warn').mockImplementation(() => {});
    sessionStorage.get.mockRejectedValueOnce(new Error('storage unavailable'));
    const cache = new SharedCache<string, unknown>('tree');

    await expect(cache.get('album')).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

function createSessionStorage(initial: Record<string, unknown>) {
  let data = { ...initial };

  return {
    get: rstest.fn((key?: string) => {
      if (!key) {
        return Promise.resolve({ ...data });
      }

      return Promise.resolve({ [key]: data[key] });
    }),
    set: rstest.fn((items: Record<string, unknown>) => {
      data = { ...data, ...items };
      return Promise.resolve();
    }),
    remove: rstest.fn((keys: string[]) => {
      keys.forEach((key) => {
        delete data[key];
      });
      return Promise.resolve();
    }),
  };
}
