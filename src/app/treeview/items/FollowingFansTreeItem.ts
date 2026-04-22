import { Artwork } from 'src/bandcamp/domain/artwork/artwork';
import { PageCollection } from 'src/bandcamp/domain/page/PageCollection';
import type { FollowingFanItem } from 'src/bandcamp/domain/types/CollectionPageData';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { isBandcampFanUrl } from 'src/bandcamp/domain/url/helper';
import { currentPageUrl, storage } from 'src/core/shared';
import { TreeItemButtonFactory } from '../buttons/factory';
import type { TreeItem } from '../TreeItem';
import { item, link } from '../TreeItemBuilder';
import type { TreeItemButton } from '../TreeItemButton';
import { createLoadHandler } from '../utils';

const FOLLOWING_FANS_KEY = '/following-fans';

export class FollowingFansTreeItem {
  static async create(username: string): Promise<TreeItem> {
    const followingFans: FollowingFanItem[] =
      await loadFollowingFansFromStorage();
    const children: TreeItem[] = followingFans.map((item) =>
      link(item.name, item.trackpipe_url)
        .withImage(Artwork.createForBand(item.image_id as number).smallSizeUrl)
        .build(),
    );

    const buttons: TreeItemButton[] = [
      createFollowingFansOpenTreeItemButton(username),
    ];

    if (isBandcampFanUrl(currentPageUrl, username)) {
      buttons.unshift(createFollowingFansRefreshTreeItemButton());
    }

    return item('Following Fans')
      .withChildren(children)
      .withButtons(buttons)
      .build();
  }
}

function createFollowingFansOpenTreeItemButton(
  username: string,
): TreeItemButton {
  return TreeItemButtonFactory.createExternalLink(
    'Open Following Fans',
    BandcampUrlFactory.generateFollowingFansUrl(username),
  );
}

function createFollowingFansRefreshTreeItemButton(): TreeItemButton {
  return TreeItemButtonFactory.createRefreshButton(
    'Refresh Following Fans',
    createLoadHandler(loadFollowingFans),
  );
}

async function loadFollowingFansFromStorage(): Promise<FollowingFanItem[]> {
  return (await storage.getByKey(FOLLOWING_FANS_KEY)) || [];
}

async function loadFollowingFans(): Promise<FollowingFanItem[]> {
  const pageCollection = new PageCollection();
  const followingFans = await pageCollection.loadFollowingFansItems();
  await storage.set({ [FOLLOWING_FANS_KEY]: followingFans });

  return followingFans;
}
