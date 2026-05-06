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
    const results: chrome.history.HistoryItem[] = [
      { id: '1', url: 'https://bandcamp.com' },
    ];
    const search = rstest.fn(
      (
        _query: chrome.history.HistoryQuery,
        callback?: (results: chrome.history.HistoryItem[]) => void,
      ) => {
        callback?.(results);
      },
    );
    installChrome({ history: { search } });

    await expect(History.search({ text: 'bandcamp' })).resolves.toBe(results);

    expect(search).toHaveBeenCalledWith(
      { text: 'bandcamp' },
      expect.any(Function),
    );
  });

  it('falls back to runtime messaging when chrome.history is unavailable', async () => {
    const results: chrome.history.HistoryItem[] = [
      { id: '1', url: 'https://bandcamp.com' },
    ];
    const sendMessage = rstest.fn(
      (
        _message: unknown,
        callback: (response: HistorySearchResponse) => void,
      ) => callback({ results }),
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
    const sendMessage = rstest.fn(
      (
        _message: unknown,
        callback: (response: HistorySearchResponse) => void,
      ) => callback({ error: 'Denied' }),
    );
    installChrome({ runtime: { sendMessage } });

    await expect(History.search({ text: 'bandcamp' })).rejects.toThrow(
      'Denied',
    );
  });
});

type HistorySearchResponse = {
  error?: string;
  results?: chrome.history.HistoryItem[];
};

type ChromeTestMock = {
  history?: {
    search: (
      query: chrome.history.HistoryQuery,
      callback: (results: chrome.history.HistoryItem[]) => void,
    ) => void | Promise<chrome.history.HistoryItem[]>;
  };
  runtime?: {
    sendMessage: (
      message: unknown,
      callback: (response: HistorySearchResponse) => void,
    ) => void;
  };
};

function installChrome(chromeMock: ChromeTestMock) {
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
