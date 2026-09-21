import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { Band } from 'src/bandcamp/domain/band/band';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { MainSidePanelSections } from 'src/features/treeview/items/MainSidePanelSections';
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
    const fanContext = {
      data: {},
      fanData: { username: 'listener', name: 'Listener', fan_id: 42 },
    };
    const sendMessage = rs.spyOn(chrome.runtime, 'sendMessage');
    sendMessage.mockImplementationOnce(async () => ({ pageData: fanContext }));
    const { sections: first } = await createActiveTabSidePanelData({
      id: 1,
      windowId: 1,
      url: 'https://first-test.bandcamp.com/music',
    });
    expect(first.map((section) => section.id)).toContain('wishlist-listener');

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
