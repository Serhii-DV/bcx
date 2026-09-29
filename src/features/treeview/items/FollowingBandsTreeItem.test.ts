import { beforeEach, describe, expect, it, rs } from '@rstest/core';
import { Band } from 'src/bandcamp/domain/band/band';
import { BandMetadata } from 'src/bandcamp/domain/band/metadata';
import {
  libraryKey,
  readLibrary,
  readSavedItems,
  saveAvailability,
  saveSnapshot,
  stagingKey,
  unavailableKey,
} from 'src/bandcamp/domain/fanData/library';
import type { FollowingBandItem } from 'src/bandcamp/domain/page/PageCollection';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { sessionStorage, storage } from 'src/core/shared';
import { loadBandPreview } from '../BandPreview';
import { FollowingBandsTreeItem } from './FollowingBandsTreeItem';
import { appendFanArchive } from './fanArchive';
import { TreeItemCache } from './TreeItemCache';

beforeEach(async () => {
  await chrome.storage.local.clear();
  await chrome.storage.session.clear();
});

describe('Following Bands', () => {
  it('shows all stored bands in order, including after cache restoration', async () => {
    const locations = [
      'Copenhagen, Denmark',
      'Stockholm, Sweden',
      'Aarhus, Denmark',
      'Canada',
      'Amsterdam, The Netherlands',
      'Los Angeles, California',
      'Toronto, Ontario',
      'Vancouver, British Columbia',
      'Atlanta, Georgia',
      'Georgia',
      'Unknown, Made Up Region',
      'Los Angeles',
      'Montréal, Québec',
      'Moscow, Russian Federation',
      'Saint Petersburg, Russia',
    ];
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
        location: locations[index] ?? null,
        date_followed:
          index === 0
            ? '2024-01-02T03:04:05Z'
            : index === 1
              ? '2025-02-03T04:05:06Z'
              : index === 2
                ? '2024-03-04T05:06:07Z'
                : '',
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
      expect(tree?.childrenCount).toBe(5);
      expect(tree?.children?.map((item) => item.label)).toEqual([
        'Latest added',
        'A–Z',
        'Z–A',
        'Followed by Year',
        'Countries',
      ]);
      const latest = tree?.children?.[0];
      const ascending = tree?.children?.[1];
      const descending = tree?.children?.[2];
      const years = tree?.children?.[3];
      const countries = tree?.children?.[4];
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
      expect(latest?.children?.[3].timestamp).toBeUndefined();
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
      expect(years?.children?.map((item) => item.label)).toEqual([
        '2025',
        '2024',
      ]);
      expect(years?.children?.map((item) => item.image)).toEqual([
        'calendar-days',
        'calendar-days',
      ]);
      expect(years?.children?.[0].children?.map((item) => item.label)).toEqual([
        'Artist 1',
      ]);
      expect(years?.children?.[1].children?.map((item) => item.label)).toEqual([
        'Artist 0',
        'Artist 2',
      ]);
      expect(countries?.children?.map((item) => item.label)).toEqual([
        'Canada',
        'Denmark',
        'Georgia',
        'Made Up Region',
        'Netherlands',
        'Russia',
        'Sweden',
        'United States',
        'Unknown country',
      ]);
      expect(countries?.children?.map((item) => item.flagCode)).toEqual([
        'CA',
        'DK',
        'GE',
        undefined,
        'NL',
        'RU',
        'SE',
        'US',
        undefined,
      ]);
      expect(countries?.children?.[3].image).toBe('map-pin');
      expect(countries?.children?.[8].image).toBe('map-pin');
      expect(countries?.children?.map((item) => item.childrenCount)).toEqual([
        4, 2, 1, 1, 1, 2, 1, 3, 30,
      ]);
      expect(
        countries?.children?.[0].children?.map((item) => item.label),
      ).toEqual(['Artist 3', 'Artist 6', 'Artist 7', 'Artist 12']);
      expect(
        countries?.children?.[1].children?.map((item) => item.label),
      ).toEqual(['Artist 0', 'Artist 2']);
      expect(
        countries?.children?.[5].children?.map((item) => item.label),
      ).toEqual(['Artist 13', 'Artist 14']);
      expect(
        countries?.children?.[7].children?.map((item) => item.label),
      ).toEqual(['Artist 5', 'Artist 8', 'Artist 11']);
      expect(
        countries?.children?.[8].children?.[0].bandPreview?.location,
      ).toBeUndefined();
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

    const account = { fanId: 42, username: 'listener' };
    expect(
      (await FollowingBandsTreeItem.create('listener', 42)).children?.[0]
        .childrenCount,
    ).toBe(45);
    await saveSnapshot(account, 'following-bands', bands.slice(1));
    expect(
      (await readLibrary(42))?.lists['following-bands']?.current,
    ).toHaveLength(44);
    expect(
      Object.keys(
        (await readLibrary(42))?.lists['following-bands']?.records ?? {},
      ),
    ).toHaveLength(45);
    await expect(storage.getByKey('/following-bands')).resolves.toEqual([
      ...bands.slice(1),
      bands[0],
    ]);
    expect(
      await storage.getByKey(stagingKey(42, 'following-bands')),
    ).toBeUndefined();
    expect(
      (
        await FollowingBandsTreeItem.create('listener', 42)
      ).children?.[0].children?.at(-1)?.bandPreview?.following,
    ).toBe(false);
    const beforeFailure = await storage.getByKey(libraryKey(42));
    const originalSet = chrome.storage.local.set.bind(chrome.storage.local);
    const failedWrite = rs
      .spyOn(chrome.storage.local, 'set')
      .mockImplementation((items, callback) => {
        if (libraryKey(42) in items) {
          Object.defineProperty(chrome.runtime, 'lastError', {
            value: { message: 'Storage quota exceeded' },
            configurable: true,
          });
          callback?.();
          Object.defineProperty(chrome.runtime, 'lastError', {
            value: undefined,
            configurable: true,
          });
          return Promise.resolve();
        }
        return callback ? originalSet(items, callback) : originalSet(items);
      });
    await expect(saveSnapshot(account, 'following-bands', [])).rejects.toThrow(
      'Storage quota exceeded',
    );
    failedWrite.mockRestore();
    expect(await storage.getByKey(libraryKey(42))).toEqual(beforeFailure);
    expect(await storage.getByKey('/following-bands')).toEqual([
      ...bands.slice(1),
      bands[0],
    ]);
    expect(
      await storage.getByKey(stagingKey(42, 'following-bands')),
    ).toBeUndefined();
    await expect(
      saveSnapshot(account, 'following-bands', [bands[0], bands[0]]),
    ).rejects.toThrow('Duplicate item');
    const absent = {
      state: 'unavailable' as const,
      checkedAt: '2026-01-01',
      url: preview.url,
      reason: 'HTTP 404',
    };
    await saveAvailability(42, 'band:1', absent);
    await saveAvailability(42, 'band:1', {
      ...absent,
      state: 'unknown',
      reason: 'Network error',
    });
    expect(await storage.getByKey(unavailableKey(42))).toEqual({
      'band:1': absent,
    });
    const scoped = await appendFanArchive(
      await FollowingBandsTreeItem.create('listener', 42),
      42,
      'following-bands',
    );
    const archived = scoped.children?.find(
      (item) => item.label === 'Unavailable',
    );
    expect(archived?.children?.[0].bandPreview).toMatchObject({
      id: 1,
      following: false,
    });
    expect(
      scoped.children?.find((item) => item.label === 'All saved')
        ?.childrenCount,
    ).toBe(45);
    expect(
      (await FollowingBandsTreeItem.create('another-listener', 99))
        .children?.[0].childrenCount,
    ).toBe(0);
    await saveAvailability(42, 'band:1', {
      ...absent,
      state: 'available',
      reason: 'Page returned',
    });
    expect(await storage.getByKey(unavailableKey(42))).toEqual({});
    await saveSnapshot(
      { fanId: 99, username: 'another-listener' },
      'following-bands',
      [{ ...bands[0], name: 'Another account band' }],
    );
    expect(await readSavedItems('following-bands', 42)).toHaveLength(45);
    expect(
      (await readSavedItems<FollowingBandItem>('following-bands', 99))[0].name,
    ).toBe('Another account band');
    await saveSnapshot(account, 'following-bands', bands);
    expect(await readSavedItems('following-bands', 99)).toHaveLength(1);
    expect(
      (await readLibrary(42))?.lists['following-bands']?.current,
    ).toHaveLength(45);
  });

  it('handles an empty stored list', async () => {
    const tree = await FollowingBandsTreeItem.create('listener');
    expect(tree.children?.map((item) => item.label)).toEqual([
      'Latest added',
      'A–Z',
      'Z–A',
      'Countries',
    ]);
    expect(tree.children?.every((item) => item.childrenCount === 0)).toBe(true);
    expect(tree.childrenCount).toBe(4);
  });
});
