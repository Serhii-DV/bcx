import { describe, expect, it } from '@rstest/core';
import { shouldReloadActiveTab } from './activeTabUpdates';

const tab = { id: 1, url: 'https://first.bandcamp.com/music' };

describe('shouldReloadActiveTab', () => {
  it('reloads when navigating to another artist', () => {
    expect(
      shouldReloadActiveTab(tab, 1, {
        url: 'https://second.bandcamp.com/music',
      }),
    ).toBe(true);
  });

  it('retries when the destination finishes loading, without another URL update', () => {
    const destination = { ...tab, url: 'https://second.bandcamp.com/music' };
    expect(shouldReloadActiveTab(destination, 1, { status: 'complete' })).toBe(
      true,
    );
  });

  it('reloads data after refreshing the same page', () => {
    expect(
      shouldReloadActiveTab(tab, 1, { status: 'complete', url: tab.url }),
    ).toBe(true);
  });

  it('ignores unrelated tabs, loading events, and query-only changes', () => {
    expect(shouldReloadActiveTab(tab, 2, { status: 'complete' })).toBe(false);
    expect(shouldReloadActiveTab(null, 1, { status: 'complete' })).toBe(false);
    expect(shouldReloadActiveTab(tab, 1, { status: 'loading' })).toBe(false);
    expect(
      shouldReloadActiveTab(tab, 1, { url: `${tab.url}?filter=ambient` }),
    ).toBe(false);
  });
});
