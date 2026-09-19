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

describe('catalog navigation preserves the mounted side panel', () => {
  const releaseUrl = 'https://first.bandcamp.com/album/one';
  const otherReleaseUrl = 'https://label-artist.bandcamp.com/album/two';
  const navigationUrls = [
    tab.url,
    'https://first.bandcamp.com/',
    releaseUrl,
    otherReleaseUrl,
  ];

  it('preserves both the URL change and the completion event when opening a release', () => {
    expect(
      shouldReloadActiveTab(
        tab,
        1,
        { url: releaseUrl, status: 'loading' },
        navigationUrls,
      ),
    ).toBe(false);
    const destination = { ...tab, url: releaseUrl };
    expect(
      shouldReloadActiveTab(
        destination,
        1,
        { status: 'complete' },
        navigationUrls,
      ),
    ).toBe(false);
    expect(
      shouldReloadActiveTab(
        destination,
        1,
        { status: 'complete', url: releaseUrl },
        navigationUrls,
      ),
    ).toBe(false);
  });

  it('preserves consecutive releases, including catalog entries on another hostname', () => {
    const destination = { ...tab, url: releaseUrl };
    expect(
      shouldReloadActiveTab(
        destination,
        1,
        { url: otherReleaseUrl },
        navigationUrls,
      ),
    ).toBe(false);
    expect(
      shouldReloadActiveTab(
        { ...tab, url: otherReleaseUrl },
        1,
        { status: 'complete' },
        navigationUrls,
      ),
    ).toBe(false);
  });

  it('preserves back navigation to the artist page and refreshes within the catalog', () => {
    expect(
      shouldReloadActiveTab(
        { ...tab, url: releaseUrl },
        1,
        { url: tab.url },
        navigationUrls,
      ),
    ).toBe(false);
    expect(
      shouldReloadActiveTab(tab, 1, { status: 'complete' }, navigationUrls),
    ).toBe(false);
  });

  it('ignores queries, fragments, and trailing slashes for catalog membership', () => {
    expect(
      shouldReloadActiveTab(
        tab,
        1,
        { url: `${releaseUrl}/?from=discover#tracks` },
        navigationUrls,
      ),
    ).toBe(false);
  });

  it('reloads for an unrelated artist, release, or noncatalog page', () => {
    for (const url of [
      'https://other.bandcamp.com/music',
      'https://first.bandcamp.com/album/unknown',
      'https://first.bandcamp.com/merch',
    ]) {
      expect(shouldReloadActiveTab(tab, 1, { url }, navigationUrls)).toBe(true);
    }
  });

  it('does not preserve stale sections belonging to a previous page', () => {
    expect(
      shouldReloadActiveTab(
        { ...tab, url: 'https://other.bandcamp.com/music' },
        1,
        { url: releaseUrl, status: 'complete' },
        navigationUrls,
      ),
    ).toBe(true);
  });

  it('still reloads completion before a catalog is available', () => {
    expect(shouldReloadActiveTab(tab, 1, { status: 'complete' }, [])).toBe(
      true,
    );
  });

  it('ignores other tabs and does not treat invalid catalog URLs as matches', () => {
    expect(
      shouldReloadActiveTab(
        tab,
        2,
        { url: releaseUrl, status: 'complete' },
        navigationUrls,
      ),
    ).toBe(false);
    expect(
      shouldReloadActiveTab(
        { id: 1, url: 'invalid' },
        1,
        { url: 'also invalid' },
        ['invalid', 'also invalid'],
      ),
    ).toBe(true);
  });
});
