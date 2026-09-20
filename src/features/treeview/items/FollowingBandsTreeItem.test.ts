import { beforeEach, describe, expect, it } from '@rstest/core';
import type { FollowingBandItem } from 'src/bandcamp/domain/page/PageCollection';
import { sessionStorage, storage } from 'src/core/shared';
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
        date_followed: '',
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
      expect(tree?.childrenCount).toBe(45);
      expect(tree?.children?.map((item) => item.label)).toEqual(
        bands.map((band) => band.name),
      );
      expect(tree?.children?.map((item) => item.href)).toEqual(
        bands.map(
          (band) => `https://${band.url_hints.subdomain}.bandcamp.com/`,
        ),
      );
      expect(
        tree?.buttons?.some(
          (button) => button.title === 'Open Following Bands',
        ),
      ).toBe(true);
    }
  });

  it('handles an empty stored list', async () => {
    const tree = await FollowingBandsTreeItem.create('listener');
    expect(tree.children).toEqual([]);
    expect(tree.childrenCount).toBe(0);
  });
});
