import { ExternalLink, RefreshCcw } from '@lucide/svelte';
import { Band } from 'src/bandcamp/domain/band/band';
import {
  type FollowingBandItem,
  PageCollection,
} from 'src/bandcamp/domain/page/PageCollection';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { isBandcampFanUrl } from 'src/bandcamp/domain/url/helper';
import { currentPageUrl, storage } from 'src/core/shared';
import type { TreeItem } from '../TreeItem';
import type { TreeItemButton } from '../TreeItemButton';
import { TreeItemFactory } from '../TreeItemFactory';
import { createLoadHandler } from '../utils';

const FOLLOWING_BANDS_KEY = '/following-bands';

export class FollowingBandsTreeItem {
  static async create(username: string): Promise<TreeItem> {
    const followingBands = await loadFollowingBandsFromStorage();
    const children: TreeItem[] = followingBands.map((item) => {
      const band = Band.create(
        item.band_id,
        item.name,
        BandcampUrlFactory.generateBandUrlFromSubdomain(
          item.url_hints.subdomain,
        ),
        item.image_id as number,
      );
      return TreeItemFactory.fromBand(band);
    });

    const buttons: TreeItemButton[] = [
      createFollowingBandsOpenTreeItemButton(username),
    ];

    if (isBandcampFanUrl(currentPageUrl, username)) {
      buttons.unshift(createFollowingBandsRefreshTreeItemButton());
    }

    return {
      label: `Following Bands`,
      children,
      buttons,
    };
  }
}

function createFollowingBandsOpenTreeItemButton(
  username: string,
): TreeItemButton {
  return {
    title: 'Open Following Bands',
    icon: ExternalLink,
    href: BandcampUrlFactory.generateFollowingBandsUrl(username),
  };
}

function createFollowingBandsRefreshTreeItemButton(): TreeItemButton {
  return {
    title: 'Refresh Following Bands',
    icon: RefreshCcw,
    onClick: createLoadHandler(loadFollowingBands),
  };
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
