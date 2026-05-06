import { afterEach, describe, expect, it, rstest } from '@rstest/core';
import { applyMusicFilterQuery, openUrlInActiveTab } from './extensionActions';
import { MessageType } from './message';

describe('extension actions', () => {
  const originalChrome = globalThis.chrome;

  afterEach(() => {
    Object.defineProperty(globalThis, 'chrome', {
      value: originalChrome,
      configurable: true,
    });
  });

  it('does not send messages outside an extension page', async () => {
    const sendMessage = rstest.fn();
    Object.defineProperty(globalThis, 'chrome', {
      value: {
        runtime: {
          id: 'extension-id',
          sendMessage,
        },
      },
      configurable: true,
    });

    await applyMusicFilterQuery('ambient');
    await expect(openUrlInActiveTab('https://bandcamp.com')).resolves.toBe(
      false,
    );

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('does not send messages when chrome runtime is missing', async () => {
    Object.defineProperty(globalThis, 'chrome', {
      value: undefined,
      configurable: true,
    });

    await applyMusicFilterQuery('ambient');
    await expect(openUrlInActiveTab('https://bandcamp.com')).resolves.toBe(
      false,
    );
  });

  it('uses the expected message contracts', () => {
    expect(MessageType.APPLY_MUSIC_FILTER_QUERY).toBe(
      'APPLY_MUSIC_FILTER_QUERY',
    );
    expect(MessageType.OPEN_ACTIVE_TAB_URL).toBe('OPEN_ACTIVE_TAB_URL');
  });
});
