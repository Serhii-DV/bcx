import { Band } from 'src/bandcamp/domain/band/band';
import {
  type FollowingBandItem,
  PageCollection,
} from 'src/bandcamp/domain/page/PageCollection';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { isBandcampFanUrl } from 'src/bandcamp/domain/url/helper';
import { currentPageUrl, storage } from 'src/core/shared';
import { TreeItemButtonFactory } from '../buttons/factory';
import { BandTreeItemFactory } from '../factories/BandTreeItemFactory';
import type { TreeItem } from '../TreeItem';
import type { TreeItemButton } from '../TreeItemButton';
import { createLoadHandler } from '../utils';
import { createPagedTreeItem } from './createPagedTreeItem';

const FOLLOWING_BANDS_KEY = '/following-bands';
const FOLLOWING_BANDS_BATCH_SIZE = 20;

export class FollowingBandsTreeItem {
  static async create(username: string): Promise<TreeItem> {
    const followingBands = await loadFollowingBandsFromStorage();

    const buttons: TreeItemButton[] = [
      createFollowingBandsOpenTreeItemButton(username),
    ];

    if (isBandcampFanUrl(currentPageUrl, username)) {
      buttons.unshift(createFollowingBandsRefreshTreeItemButton());
    }

    return createPagedTreeItem({
      batchSize: FOLLOWING_BANDS_BATCH_SIZE,
      buttons,
      errorContext:
        '[FollowingBandsTreeItem.createLoadMoreFollowingBandsTreeItem]',
      errorMessage: 'Failed to load more following bands:',
      items: followingBands,
      label: 'Following Bands',
      createChildren: (followingBands) =>
        followingBands.map((item) => this.createFollowingBandTreeItem(item)),
    });
  }

  private static createFollowingBandTreeItem(
    item: FollowingBandItem,
  ): TreeItem {
    const band = Band.create(
      item.band_id,
      item.name,
      BandcampUrlFactory.generateBandUrlFromSubdomain(item.url_hints.subdomain),
      item.image_id as number,
    );

    return BandTreeItemFactory.create(band);
  }
}

function createFollowingBandsOpenTreeItemButton(
  username: string,
): TreeItemButton {
  return TreeItemButtonFactory.createExternalLink(
    'Open Following Bands',
    BandcampUrlFactory.generateFollowingBandsUrl(username),
  );
}

function createFollowingBandsRefreshTreeItemButton(): TreeItemButton {
  return TreeItemButtonFactory.createRefreshButton(
    'Refresh Following Bands',
    createLoadHandler(loadFollowingBands),
  );
}

async function loadFollowingBandsFromStorage(): Promise<FollowingBandItem[]> {
  return (await storage.getByKey(FOLLOWING_BANDS_KEY)) || [];
}

async function loadFollowingBands(): Promise<FollowingBandItem[]> {
  const pageCollection = new PageCollection();
  const followingBands = await pageCollection.loadFollowingBandsItems({
    includeSummaryFlags: false, // Following bands don't need purchase/wishlist flags
  });
  await storage.set({ [FOLLOWING_BANDS_KEY]: followingBands });

  return followingBands;
}
