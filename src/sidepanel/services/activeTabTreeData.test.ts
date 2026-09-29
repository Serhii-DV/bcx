import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { Band } from 'src/bandcamp/domain/band/band';
import { libraryKey } from 'src/bandcamp/domain/fanData/library';
import { detectFanDataFromPageData } from 'src/bandcamp/domain/pageData/pageData';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { Url } from 'src/core/url';
import { createRootSectionTabs } from 'src/features/bcx/components/rootSectionTabs';
import { MainSidePanelSections } from 'src/features/treeview/items/MainSidePanelSections';
import { TreeItemCache } from 'src/features/treeview/items/TreeItemCache';
import {
  createActiveTabSidePanelData,
  getActiveTabHeader,
} from './activeTabTreeData';

afterEach(() => {
  rs.restoreAllMocks();
});

describe('active tab fan sections during navigation', () => {
  it('keeps fan sections across hostnames without carrying over artist page data', async () => {
    rs.spyOn(BandcampStorage, 'getByUuids').mockResolvedValue([]);
    rs.spyOn(BandcampStorage, 'getBands').mockResolvedValue([]);
    const createSections = rs.spyOn(MainSidePanelSections, 'create');
    const data = {
      identities: { fan: { id: 42, username: 'listener', name: 'Listener' } },
    };
    const fanContext = {
      data,
      fanData: detectFanDataFromPageData(
        { data },
        Url.create('https://first-test.bandcamp.com/music'),
      ),
    };
    expect(fanContext.fanData.fan_id).toBe(42);
    expect(
      detectFanDataFromPageData(
        { data: { identities: { fan: null } } },
        Url.create('https://first-test.bandcamp.com/music'),
      ).fan_id,
    ).toBeUndefined();
    const sendMessage = rs.spyOn(chrome.runtime, 'sendMessage');
    sendMessage.mockImplementationOnce(async () => ({ pageData: fanContext }));
    const { sections: first } = await createActiveTabSidePanelData({
      id: 1,
      windowId: 1,
      url: 'https://first-test.bandcamp.com/music',
    });
    expect(first.map((section) => section.id)).toContain('wishlist-listener');
    expect(first.some((section) => section.id === 'fan-listener')).toBe(false);
    const otherFanSections = await MainSidePanelSections.create(
      Url.create('https://bandcamp.com/other'),
      null,
      {
        pageData: {
          data: {
            fan_data: { fan_id: 99, username: 'other', name: 'Other Fan' },
          },
          fanData: fanContext.fanData,
        },
      },
    );
    expect(
      otherFanSections.find((section) => section.id === 'fan-listener')?.label,
    ).toBe('Fan: Other Fan');
    for (const dataset of ['wishlist', 'following-bands']) {
      const section = first.find(
        (section) => section.fanSync?.dataset === dataset,
      );
      expect(section?.fanSync?.account).toEqual({
        fanId: 42,
        username: 'listener',
      });
      const tree = await section!.createTreeData();
      expect(
        createRootSectionTabs(tree.items).map((tab) => tab.label),
      ).toContain('Unavailable');
    }
    const currentGenre = { name: 'Metal', tag_page_url: '/tag/metal' };
    const pastGenre = { name: 'Ambient', tag_page_url: '/tag/ambient' };
    await chrome.storage.local.set({
      '/following-genres': [currentGenre, pastGenre],
      [libraryKey(42)]: {
        version: 1,
        account: { fanId: 42, username: 'listener' },
        revision: 'sync-1',
        lists: {
          'following-genres': {
            records: {
              'genre:/tag/metal': currentGenre,
              'genre:/tag/ambient': pastGenre,
            },
            current: ['genre:/tag/metal'],
            syncedAt: '2026-09-29T00:00:00Z',
          },
        },
      },
    });
    try {
      const genres = first.find(
        (section) => section.fanSync?.dataset === 'following-genres',
      );
      const tree = await genres!.createTreeData();
      expect(createRootSectionTabs(tree.items).map((tab) => tab.label)).toEqual(
        ['All (2)', 'No longer followed (1)'],
      );
      expect(tree.items[0].children?.map((item) => item.label)).toEqual([
        'Metal',
        'Ambient',
      ]);
    } finally {
      await chrome.storage.local.remove(['/following-genres', libraryKey(42)]);
      await chrome.storage.session.remove(
        TreeItemCache.subtreeKey(42, 'following-genres'),
      );
    }
    expect(
      first.find((section) => section.id === 'history')?.fanAccount?.fanId,
    ).toBe(42);

    sendMessage.mockImplementationOnce(async () => ({
      pageData: null,
      error: 'Content script not ready',
    }));
    const { sections: next } = await createActiveTabSidePanelData({
      id: 1,
      windowId: 1,
      url: 'https://second-test.bandcamp.com/music',
    });
    expect(next.map((section) => section.id)).toContain('wishlist-listener');
    expect(next.map((section) => section.id)).toContain('collection-listener');
    expect(createSections.mock.calls.at(-1)?.[1]).toBeNull();
    expect(createSections.mock.calls.at(-1)?.[2]?.pageData).toEqual(fanContext);

    const anonymous = await MainSidePanelSections.create(
      Url.create('https://second-test.bandcamp.com/music'),
      null,
      {
        pageData: {
          data: {},
          fanData: detectFanDataFromPageData(
            { data: {} },
            Url.create('https://second-test.bandcamp.com/music'),
          ),
        },
      },
    );
    const anonymousWishlist = anonymous.find(
      (section) => section.fanSync?.dataset === 'wishlist',
    );
    expect(anonymousWishlist?.fanSync).toEqual({
      account: undefined,
      dataset: 'wishlist',
    });
    const anonymousTree = await anonymousWishlist!.createTreeData();
    expect(
      createRootSectionTabs(anonymousTree.items).map((tab) => tab.label),
    ).toContain('Unavailable');

    const updatedContext = {
      data: {},
      fanData: { username: 'updated', name: 'Updated', fan_id: 43 },
    };
    sendMessage.mockImplementationOnce(async () => ({
      pageData: updatedContext,
    }));
    const { sections: refreshed } = await createActiveTabSidePanelData({
      id: 1,
      windowId: 1,
      url: 'https://second-test.bandcamp.com/music',
    });
    expect(refreshed.map((section) => section.id)).toContain(
      'collection-updated',
    );
    expect(refreshed.map((section) => section.id)).not.toContain(
      'collection-listener',
    );
  });
});

describe('active tab public profile', () => {
  it('passes the content-script profile into the actual About panel', async () => {
    const profile = {
      location: 'Copenhagen, Denmark',
      biography: 'Independent label.',
      links: [{ label: 'Instagram', url: 'https://instagram.com/example' }],
    };
    rs.spyOn(chrome.runtime, 'sendMessage').mockImplementation(async () => ({
      pageData: {
        data: {},
        fanData: {},
        bandProfile: profile,
        musicBand: {
          id: 901,
          name: 'Example',
          url: 'https://profile-test.bandcamp.com',
          artworkId: 0,
          metadata: { created: '2020-01-01', currency: 'EUR' },
          albums: [],
          tracks: [],
        },
      },
    }));
    const { sections } = await createActiveTabSidePanelData({
      id: 1,
      windowId: 1,
      url: 'https://profile-test.bandcamp.com/music',
    });
    const tree = await sections
      .find((section) => section.id === 'band-901')
      ?.createTreeData();
    const about = tree?.items.find((item) => item.label === 'About');
    expect(about?.children?.map((item) => item.label)).toContain(
      'Location: Copenhagen, Denmark',
    );
    expect(about?.children?.map((item) => item.label)).toContain(
      'Independent label.',
    );
    expect(
      about?.children?.find((item) => item.label === 'Websites & social links')
        ?.children?.[0].href,
    ).toBe(profile.links[0].url);
  });

  it('refreshes an older stored profile when live catalog data is unavailable', async () => {
    const band = Band.create(
      902,
      'Example',
      'https://profile-stored.bandcamp.com',
      0,
    );
    band.metadata.location = 'Old location';
    rs.spyOn(BandcampStorage, 'getByUuids').mockResolvedValue([band]);
    rs.spyOn(BandcampStorage, 'getBands').mockResolvedValue([band]);
    rs.spyOn(chrome.runtime, 'sendMessage').mockImplementation(async () => ({
      pageData: {
        data: {},
        fanData: {},
        bandProfile: { location: 'Paris, France', links: [] },
      },
    }));
    const { sections } = await createActiveTabSidePanelData({
      id: 1,
      windowId: 1,
      url: 'https://profile-stored.bandcamp.com/music',
    });
    const tree = await sections
      .find((section) => section.id === 'band-902')
      ?.createTreeData();
    expect(
      tree?.items
        .find((item) => item.label === 'About')
        ?.children?.map((item) => item.label),
    ).toContain('Location: Paris, France');
  });
});

describe('active tab header refresh', () => {
  it('refreshes the header without rebuilding catalog sections', async () => {
    const band = Band.create(
      903,
      'Current Artist',
      'https://header-test.bandcamp.com',
      123,
    );
    rs.spyOn(chrome.runtime, 'sendMessage').mockImplementation(async () => ({
      pageData: null,
    }));
    rs.spyOn(BandcampStorage, 'getByUuids').mockResolvedValue([band]);
    rs.spyOn(BandcampStorage, 'getBands').mockResolvedValue([band]);
    const createSections = rs.spyOn(MainSidePanelSections, 'create');
    const header = await getActiveTabHeader({
      id: 1,
      windowId: 1,
      url: 'https://header-test.bandcamp.com/music',
    });
    expect(header).toEqual({
      title: band.name,
      imageUrl: band.artwork.smallSizeUrl,
    });
    expect(createSections).not.toHaveBeenCalled();
  });
});
