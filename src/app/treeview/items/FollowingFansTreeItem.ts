import { Artwork } from 'src/bandcamp/domain/artwork/artwork';
import { PageCollection } from 'src/bandcamp/domain/page/PageCollection';
import type { FollowingFanItem } from 'src/bandcamp/domain/types/CollectionPageData';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import type { TreeItem } from '../TreeItem';
import { link } from '../TreeItemBuilder';
import { createStoredFanListTreeItem } from './storedFanListTreeItem';

const FOLLOWING_FANS_KEY = '/following-fans';

export class FollowingFansTreeItem {
  static async create(username: string): Promise<TreeItem> {
    return createStoredFanListTreeItem<FollowingFanItem>({
      label: 'Following Fans',
      openButtonLabel: 'Open Following Fans',
      openUrl: BandcampUrlFactory.generateFollowingFansUrl(username),
      refreshButtonLabel: 'Refresh Following Fans',
      storageKey: FOLLOWING_FANS_KEY,
      username,
      loadItems: loadFollowingFans,
      createTreeItem: (item) =>
        link(item.name, item.trackpipe_url)
          .withImage(
            Artwork.createForBand(item.image_id as number).smallSizeUrl,
          )
          .build(),
    });
  }
}

async function loadFollowingFans(): Promise<FollowingFanItem[]> {
  const pageCollection = new PageCollection();
  return pageCollection.loadFollowingFansItems();
}
