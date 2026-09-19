import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { MainSidePanelSections } from 'src/features/treeview/items/MainSidePanelSections';
import { createActiveTabSidePanelSections } from './activeTabTreeData';

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
    const first = await createActiveTabSidePanelSections({
      id: 1,
      windowId: 1,
      url: 'https://first-test.bandcamp.com/music',
    });
    expect(first.map((section) => section.id)).toContain('wishlist-listener');

    sendMessage.mockImplementationOnce(async () => ({
      pageData: null,
      error: 'Content script not ready',
    }));
    const next = await createActiveTabSidePanelSections({
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
    const refreshed = await createActiveTabSidePanelSections({
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
