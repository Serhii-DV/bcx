import { afterEach, describe, expect, it, rstest } from '@rstest/core';
import { getExtensionUrl } from './chrome.runtime';

describe('getExtensionUrl', () => {
  const originalChrome = globalThis.chrome;

  afterEach(() => {
    Object.defineProperty(globalThis, 'chrome', {
      value: originalChrome,
      configurable: true,
    });
  });

  it('delegates to chrome.runtime.getURL', () => {
    const getURL = rstest.fn((path: string) => `chrome-extension://id/${path}`);
    Object.defineProperty(globalThis, 'chrome', {
      value: { runtime: { getURL } },
      configurable: true,
    });

    expect(getExtensionUrl('icons/icon.png')).toBe(
      'chrome-extension://id/icons/icon.png',
    );
    expect(getURL).toHaveBeenCalledWith('icons/icon.png');
  });
});
