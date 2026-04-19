import { describe, expect, it } from '@rstest/core';
import { copyToClipboard } from './clipboard';

describe('copyToClipboard', () => {
  it('rejects when the Clipboard API is unavailable', async () => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });

    await expect(copyToClipboard('content')).rejects.toThrow(
      'The Clipboard API is not available.',
    );
  });
});
