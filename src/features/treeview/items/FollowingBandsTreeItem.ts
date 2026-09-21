import { Band } from 'src/bandcamp/domain/band/band';
import {
  type FollowingBandItem,
  PageCollection,
} from 'src/bandcamp/domain/page/PageCollection';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { BandTreeItemFactory } from '../factories/BandTreeItemFactory';
import type { TreeItem } from '../TreeItem';
import { createStoredFanListTreeItem } from './createStoredFanListTreeItem';

const FOLLOWING_BANDS_KEY = '/following-bands';

export class FollowingBandsTreeItem {
  static async create(username: string): Promise<TreeItem> {
    return createStoredFanListTreeItem<FollowingBandItem>({
      label: 'Following Bands',
      openButtonLabel: 'Open Following Bands',
      openUrl: BandcampUrlFactory.generateFollowingBandsUrl(username),
      refreshButtonLabel: 'Refresh Following Bands',
      storageKey: FOLLOWING_BANDS_KEY,
      username,
      loadItems: loadFollowingBands,
      createTreeItem: (item) => this.createFollowingBandTreeItem(item),
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

    return BandTreeItemFactory.createWithPreview(band, {
      following: true,
      location: item.location ?? undefined,
    });
  }
}

async function loadFollowingBands(): Promise<FollowingBandItem[]> {
  const pageCollection = new PageCollection();
  return pageCollection.loadFollowingBandsItems({
    includeSummaryFlags: false,
  });
}
