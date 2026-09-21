import { beforeEach, describe, expect, it } from '@rstest/core';
import { Band } from 'src/bandcamp/domain/band/band';
import { BandMetadata } from 'src/bandcamp/domain/band/metadata';
import type { FollowingBandItem } from 'src/bandcamp/domain/page/PageCollection';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { sessionStorage, storage } from 'src/core/shared';
import { loadBandPreview } from '../BandPreview';
import { FollowingBandsTreeItem } from './FollowingBandsTreeItem';
import { TreeItemCache } from './TreeItemCache';

beforeEach(async () => {
  await chrome.storage.local.clear();
  await chrome.storage.session.clear();
});

describe('Following Bands', () => {
  it('shows all stored bands in order, including after cache restoration', async () => {
    const bands: FollowingBandItem[] = Array.from(
      { length: 45 },
      (_, index) => ({
        band_id: index + 1,
        image_id: index + 1,
        art_id: index + 1,
        url_hints: { subdomain: `artist${index}`, custom_domain: null },
        name: `Artist ${index}`,
        is_following: true,
        is_subscribed: false,
        location: null,
        date_followed: index === 0 ? '2024-01-02T03:04:05Z' : '',
        token: `token-${index}`,
      }),
    );
    await storage.set({ '/following-bands': bands });
    const key = TreeItemCache.subtreeKey('listener', 'following-bands');
    await sessionStorage.setByKey(key, {
      version: 8,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60000,
      item: { label: 'Following Bands', children: [{ label: 'Load more' }] },
    });
    const original = await TreeItemCache.getOrCreate(key, () =>
      FollowingBandsTreeItem.create('listener'),
    );
    const restored = await TreeItemCache.get(key);
    for (const tree of [original, restored]) {
      expect(tree?.childrenCount).toBe(3);
      expect(tree?.children?.map((item) => item.label)).toEqual([
        'Latest added',
        'A–Z',
        'Z–A',
      ]);
      const latest = tree?.children?.[0];
      const ascending = tree?.children?.[1];
      const descending = tree?.children?.[2];
      expect(latest?.childrenCount).toBe(45);
      expect(latest?.children?.[0].bandPreview).toMatchObject({
        id: 1,
        name: 'Artist 0',
        url: 'https://artist0.bandcamp.com/',
        cached: false,
      });
      expect(latest?.children?.[0].timestamp).toEqual({
        label: 'Followed',
        dateTime: '2024-01-02T03:04:05.000Z',
      });
      expect(latest?.children?.[1].timestamp).toBeUndefined();
      expect(latest?.children?.map((item) => item.label)).toEqual(
        bands.map((band) => band.name),
      );
      expect(latest?.children?.map((item) => item.href)).toEqual(
        bands.map(
          (band) => `https://${band.url_hints.subdomain}.bandcamp.com/`,
        ),
      );
      expect(ascending?.children?.map((item) => item.label)).toEqual(
        [...bands]
          .sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { numeric: true }),
          )
          .map((band) => band.name),
      );
      expect(descending?.children?.map((item) => item.label)).toEqual(
        [...bands]
          .sort((a, b) =>
            b.name.localeCompare(a.name, undefined, { numeric: true }),
          )
          .map((band) => band.name),
      );
      expect(
        tree?.buttons?.some(
          (button) => button.title === 'Open Following Bands',
        ),
      ).toBe(true);
    }
    const preview = restored?.children?.[0].children?.[0].bandPreview;
    if (!preview)
      throw new Error('Missing band preview after cache restoration');
    expect(await loadBandPreview(preview)).toEqual(preview);
    await BandcampStorage.saveBand(
      Band.create(
        1,
        'Artist 0',
        preview.url,
        1,
        new BandMetadata(
          new Date('2020-01-01'),
          'EUR',
          [],
          [],
          'Copenhagen',
          'Band biography',
          [
            { label: 'Website', url: 'https://example.com/' },
            { label: 'Invalid', url: 'javascript:alert(1)' },
          ],
        ),
      ),
    );
    expect(await loadBandPreview(preview)).toMatchObject({
      cached: true,
      biography: 'Band biography',
      location: 'Copenhagen',
      albumCount: 0,
      links: [{ label: 'Website', url: 'https://example.com/' }],
    });
  });

  it('handles an empty stored list', async () => {
    const tree = await FollowingBandsTreeItem.create('listener');
    expect(tree.children?.map((item) => item.label)).toEqual([
      'Latest added',
      'A–Z',
      'Z–A',
    ]);
    expect(tree.children?.every((item) => item.childrenCount === 0)).toBe(true);
    expect(tree.childrenCount).toBe(3);
  });
});
