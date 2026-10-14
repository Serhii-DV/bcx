import { describe, expect, it, rstest } from '@rstest/core';
import { type Message, MessageType } from 'src/core/message';
import type { BandcampItem, BandcampResponseCapture } from './PageCollection';

const loggedEntries: { label: string; capture: Record<string, unknown> }[] = [];

function installChromeMock() {
  loggedEntries.length = 0;
  Object.defineProperty(globalThis, 'chrome', {
    value: {
      runtime: {
        sendMessage: rstest.fn(async (message: Message) => {
          if (message.type === MessageType.LOG_FAN_SYNC_DEBUG)
            loggedEntries.push(structuredClone(message));
          return { ok: true };
        }),
      },
      storage: {
        local: {},
        session: {
          set: rstest.fn(),
          remove: rstest.fn(),
        },
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

async function createPageCollection(
  transport: unknown,
  captureResponse?: (capture: BandcampResponseCapture) => Promise<void>,
) {
  installChromeMock();
  const { PageCollection } = await import('./PageCollection');
  const pageCollection = new PageCollection({
    transport,
    captureResponse,
  } as any);
  pageCollection.getPageData = () =>
    ({
      fan_data: { fan_id: 42 },
      wishlist_data: { last_token: '1000:wishlist' },
      collection_data: { last_token: '1000:collection' },
      following_bands_data: { last_token: '1000:bands' },
      following_fans_data: { sequence: ['1', 'missing'] },
      following_genres_data: {
        sequence: ['metal'],
        item_count: 1,
        last_token: 'genre-1',
      },
      item_cache: {
        following_fans: {
          '1': { name: 'Fan One', trackpipe_url: '/fan-one', image_id: 123 },
        },
        following_genres: {
          metal: { name: 'Metal', tag_page_url: '/tag/metal' },
        },
      },
    }) as any;

  const pageData = pageCollection.getPageData();
  pageCollection.getPageData = () => pageData;
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
    const captures: BandcampResponseCapture[] = [];
    const { createFanResponseCapture } = await import(
      '../../content/fanSyncDebug'
    );
    const account = { fanId: 42, username: 'fan' };
    const logCapture = createFanResponseCapture(account, 'wishlist');
    const pageCollection = await createPageCollection(
      transport,
      async (capture) => {
        captures.push(structuredClone(capture));
        await logCapture(capture);
      },
    );

    const items = await pageCollection.loadWishlistItems({ pageSize: 1 });

    expect(items).toMatchObject([
      { tralbum_id: 1, isFree: true, isPurchased: true, isWishlisted: false },
      { tralbum_id: 2, isFree: false, isPurchased: false, isWishlisted: true },
    ]);
    expect(captures).toHaveLength(3);
    expect(captures[0]).toMatchObject({
      method: 'GET',
      response: { collection_summary: expect.any(Object) },
    });
    expect(captures[1]).toMatchObject({
      method: 'POST',
      request: { count: 1 },
      response: { more_available: true },
    });
    expect((captures[1].response as { items: BandcampItem[] }).items).toEqual([
      collectionItem(1),
    ]);
    expect((captures[2].response as { items: BandcampItem[] }).items).toEqual([
      collectionItem(2),
    ]);
    expect(loggedEntries).toHaveLength(3);
    const labels = loggedEntries.map((entry) => entry.label);
    const runPrefix = labels[0].slice(0, labels[0].lastIndexOf('/'));
    expect(runPrefix).toMatch(
      /^\/debug\/fan-sync\/wishlist\/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
    expect(labels).toEqual(
      ['0001', '0002', '0003'].map((page) => `${runPrefix}/${page}`),
    );
    captures.forEach((capture, index) => {
      expect(loggedEntries[index].capture).toMatchObject({
        fanId: 42,
        dataset: 'wishlist',
        page: index + 1,
        method: capture.method,
        endpoint: capture.endpoint,
      });
      // The logged snapshot retains all raw fields without later enrichment.
      expect(loggedEntries[index].capture.data).toEqual(capture.response);
    });

    const previousEntries = structuredClone(loggedEntries);
    const nextRun = createFanResponseCapture(account, 'wishlist');
    await nextRun(captures[1]);
    expect(loggedEntries).toHaveLength(4);
    expect(loggedEntries.slice(0, 3)).toEqual(previousEntries);
    expect(loggedEntries[3].label).not.toContain(runPrefix);
    expect(loggedEntries[3].label).toMatch(/\/0001$/);
    expect(loggedEntries[3].capture.data).toEqual(captures[1].response);

    const { captureFanPageData } = await import('../../content/fanSyncDebug');
    const pageData = pageCollection.getPageData();
    await captureFanPageData(account, pageData);
    expect(loggedEntries[4].label).toBe('/debug/fan-sync/page-data');
    expect(loggedEntries[4].capture.data).toEqual(pageData);
    expect(chrome.storage.session.set).not.toHaveBeenCalled();
    expect(chrome.storage.session.remove).not.toHaveBeenCalled();

    expect(transport.postJsonString).toHaveBeenCalledTimes(2);
    expect(transport.postJsonString.mock.calls[1][1]).toMatchObject({
      fan_id: 42,
      older_than_token: 'token-1',
      count: 1,
    });
    transport.postJsonString.mockResolvedValue({
      items: [collectionItem(3)],
      more_available: true,
    });
    await expect(
      pageCollection.loadWishlistItems({ includeSummaryFlags: false }),
    ).rejects.toThrow('Incomplete Bandcamp pagination');
    pageCollection.getPageData().wishlist_data.item_count = 0;
    await expect(pageCollection.loadWishlistItems()).resolves.toEqual([]);
  });

  it('loads following fans and paginates genres beyond the page cache', async () => {
    const postJsonString = rstest.fn();
    const pageCollection = await createPageCollection({
      getJson: rstest.fn(),
      postJsonString,
    });

    await expect(pageCollection.loadFollowingFansItems()).resolves.toEqual([
      { name: 'Fan One', trackpipe_url: '/fan-one', image_id: 123 },
    ]);
    await expect(pageCollection.loadFollowingGenresItems()).resolves.toEqual([
      { name: 'Metal', tag_page_url: '/tag/metal' },
    ]);
    expect(postJsonString).not.toHaveBeenCalled();
    pageCollection.getPageData().following_genres_data.item_count = 2;
    postJsonString.mockResolvedValueOnce({
      followeers: [
        { name: 'Ambient', tag_page_url: '/tag/ambient', token: 'genre-2' },
      ],
      more_available: false,
    });
    await expect(pageCollection.loadFollowingGenresItems()).resolves.toEqual([
      { name: 'Metal', tag_page_url: '/tag/metal' },
      { name: 'Ambient', tag_page_url: '/tag/ambient', token: 'genre-2' },
    ]);
    expect(postJsonString).toHaveBeenCalledWith(
      'https://bandcamp.com/api/fancollection/1/following_genres_items',
      { fan_id: 42, older_than_token: 'genre-1', count: 40 },
      undefined,
    );
    postJsonString.mockResolvedValueOnce({
      followeers: [],
      more_available: false,
    });
    await expect(pageCollection.loadFollowingGenresItems()).rejects.toThrow(
      'Incomplete following genres data',
    );
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
    const { createFanResponseCapture } = await import(
      '../../content/fanSyncDebug'
    );
    const pageCollection = await createPageCollection(
      transport,
      createFanResponseCapture(
        { fanId: 42, username: 'fan' },
        'following-bands',
      ),
    );
    const sendMessage = chrome.runtime.sendMessage as ReturnType<
      typeof rstest.fn
    >;
    sendMessage.mockRejectedValue(new Error('Debug console unavailable'));
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
