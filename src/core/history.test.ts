import { afterEach, describe, expect, it, rstest } from '@rstest/core';
import { History } from './history';
import { MessageType } from './message';

describe('History', () => {
  const originalChrome = globalThis.chrome;

  afterEach(() => {
    Object.defineProperty(globalThis, 'chrome', {
      value: originalChrome,
      configurable: true,
    });
  });

  it('uses chrome.history when the API is available', async () => {
    const results = [{ id: '1', url: 'https://bandcamp.com' }];
    const search = rstest.fn((_query, callback) => callback(results));
    installChrome({ history: { search } });

    await expect(History.search({ text: 'bandcamp' })).resolves.toBe(results);

    expect(search).toHaveBeenCalledWith(
      { text: 'bandcamp' },
      expect.any(Function),
    );
  });

  it('falls back to runtime messaging when chrome.history is unavailable', async () => {
    const results = [{ id: '1', url: 'https://bandcamp.com' }];
    const sendMessage = rstest.fn((_message, callback) =>
      callback({ results }),
    );
    installChrome({ runtime: { sendMessage } });

    await expect(History.search({ text: 'bandcamp' })).resolves.toBe(results);

    expect(sendMessage).toHaveBeenCalledWith(
      {
        type: MessageType.HISTORY_SEARCH,
        query: { text: 'bandcamp' },
      },
      expect.any(Function),
    );
  });

  it('rejects message fallback errors', async () => {
    const sendMessage = rstest.fn((_message, callback) =>
      callback({ error: 'Denied' }),
    );
    installChrome({ runtime: { sendMessage } });

    await expect(History.search({ text: 'bandcamp' })).rejects.toThrow(
      'Denied',
    );
  });
});

function installChrome(chromeMock: Partial<typeof chrome>) {
  Object.defineProperty(globalThis, 'chrome', {
    value: {
      runtime: {
        lastError: undefined,
        ...chromeMock.runtime,
      },
      history: chromeMock.history,
    },
    configurable: true,
  });
}
