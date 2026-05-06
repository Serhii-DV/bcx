import { describe, expect, it, rstest } from '@rstest/core';
import type { BandcampItem } from './PageCollection';

function installChromeMock() {
  Object.defineProperty(globalThis, 'chrome', {
    value: {
      storage: {
        local: {},
        session: {},
      },
    },
    configurable: true,
  });
}

function collectionItem(
  id: number,
  overrides: Partial<BandcampItem> = {},
): BandcampItem {
  return {
    tralbum_type: 'a',
    tralbum_id: id,
    token: `token-${id}`,
    album_id: id,
    band_id: id + 100,
    band_name: `Band ${id}`,
    item_art_id: id + 200,
    item_title: `Album ${id}`,
    item_url: `https://band${id}.bandcamp.com/album/album-${id}`,
    price: id === 1 ? 0 : 5,
    ...overrides,
  };
}

async function createPageCollection(transport: unknown) {
  installChromeMock();
  const { PageCollection } = await import('./PageCollection');
  const pageCollection = new PageCollection({ transport } as any);
  pageCollection.getPageData = () =>
    ({
      fan_data: { fan_id: 42 },
      wishlist_data: { last_token: '1000:wishlist' },
      collection_data: { last_token: '1000:collection' },
      following_bands_data: { last_token: '1000:bands' },
      following_fans_data: { sequence: ['1', 'missing'] },
      following_genres_data: { sequence: ['metal'] },
      item_cache: {
        following_fans: {
          '1': { name: 'Fan One', trackpipe_url: '/fan-one', image_id: 123 },
        },
        following_genres: {
          metal: { name: 'Metal', tag_page_url: '/tag/metal' },
        },
      },
    }) as any;

  return pageCollection;
}

describe('PageCollection', () => {
  it('replaces the timestamp prefix in tokens', async () => {
    installChromeMock();
    const { PageCollection } = await import('./PageCollection');

    expect(PageCollection.makeNowToken('1000:abc')).toMatch(/^\d+:abc$/);
    expect(PageCollection.makeNowToken('1000:abc')).not.toBe('1000:abc');
  });

  it('loads and enriches wishlist items across pages', async () => {
    const transport = {
      getJson: rstest.fn(async () => ({
        collection_summary: {
          tralbum_lookup: {
            a1: { purchased: true },
            a2: {},
          },
        },
      })),
      postJsonString: rstest
        .fn()
        .mockResolvedValueOnce({
          items: [collectionItem(1)],
          more_available: true,
        })
        .mockResolvedValueOnce({
          items: [collectionItem(2)],
          more_available: false,
        }),
    };
    const pageCollection = await createPageCollection(transport);

    const items = await pageCollection.loadWishlistItems({ pageSize: 1 });

    expect(items).toMatchObject([
      { tralbum_id: 1, isFree: true, isPurchased: true, isWishlisted: false },
      { tralbum_id: 2, isFree: false, isPurchased: false, isWishlisted: true },
    ]);
    expect(transport.postJsonString).toHaveBeenCalledTimes(2);
    expect(transport.postJsonString.mock.calls[1][1]).toMatchObject({
      fan_id: 42,
      older_than_token: 'token-1',
      count: 1,
    });
  });

  it('loads following fans and genres from page-data caches', async () => {
    const pageCollection = await createPageCollection({
      getJson: rstest.fn(),
      postJsonString: rstest.fn(),
    });

    await expect(pageCollection.loadFollowingFansItems()).resolves.toEqual([
      { name: 'Fan One', trackpipe_url: '/fan-one', image_id: 123 },
    ]);
    await expect(pageCollection.loadFollowingGenresItems()).resolves.toEqual([
      { name: 'Metal', tag_page_url: '/tag/metal' },
    ]);
  });

  it('loads following bands through the paginated endpoint', async () => {
    const transport = {
      getJson: rstest.fn(),
      postJsonString: rstest.fn(async () => ({
        followeers: [
          {
            band_id: 1,
            image_id: 2,
            art_id: 3,
            url_hints: { subdomain: 'artist', custom_domain: null },
            name: 'Artist',
            is_following: true,
            is_subscribed: null,
            location: null,
            date_followed: '2024-01-01',
            token: 'band-token',
          },
        ],
        more_available: false,
      })),
    };
    const pageCollection = await createPageCollection(transport);
    const { PageCollection } = await import('./PageCollection');

    const items = await pageCollection.loadFollowingBandsItems();

    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Artist');
    expect(transport.postJsonString).toHaveBeenCalledWith(
      PageCollection.FOLLOWING_BANDS_ITEMS_URL,
      expect.objectContaining({ fan_id: 42, count: 40 }),
      undefined,
    );
  });
});
