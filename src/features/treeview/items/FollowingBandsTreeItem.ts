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
    const item = await createStoredFanListTreeItem<FollowingBandItem>({
      label: 'Following Bands',
      openButtonLabel: 'Open Following Bands',
      openUrl: BandcampUrlFactory.generateFollowingBandsUrl(username),
      refreshButtonLabel: 'Refresh Following Bands',
      storageKey: FOLLOWING_BANDS_KEY,
      username,
      loadItems: loadFollowingBands,
      createTreeItem: (item) => this.createFollowingBandTreeItem(item),
    });
    const latestItems = item.children ?? [];
    const collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: 'base',
    });

    return {
      ...item,
      children: [
        createOrderRoot('Latest added', latestItems),
        createOrderRoot(
          'A–Z',
          [...latestItems].sort((a, b) =>
            collator.compare(a.label ?? '', b.label ?? ''),
          ),
        ),
        createOrderRoot(
          'Z–A',
          [...latestItems].sort((a, b) =>
            collator.compare(b.label ?? '', a.label ?? ''),
          ),
        ),
      ],
      childrenCount: 3,
    };
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

function createOrderRoot(label: string, items: TreeItem[]): TreeItem {
  return {
    label,
    children: items.map((item) => ({ ...item })),
    childrenCount: items.length,
    itemPreview: true,
  };
}

async function loadFollowingBands(): Promise<FollowingBandItem[]> {
  const pageCollection = new PageCollection();
  return pageCollection.loadFollowingBandsItems({
    includeSummaryFlags: false,
  });
}
