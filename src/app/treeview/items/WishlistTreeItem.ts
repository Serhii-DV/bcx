import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import {
  type BandcampItem,
  PageCollection,
} from 'src/bandcamp/domain/page/PageCollection';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { isBandcampFanUrl } from 'src/bandcamp/domain/url/helper';
import { currentPageUrl, storage } from 'src/core/shared';
import { TreeItemButtonFactory } from '../buttons/factory';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import type { TreeItem } from '../TreeItem';
import { item } from '../TreeItemBuilder';
import type { TreeItemButton } from '../TreeItemButton';
import { createLoadHandler } from '../utils';

const WISHLIST_KEY = '/wishlist';

export class WishlistTreeItem {
  static async create(username: string): Promise<TreeItem> {
    const wishlistItems = await loadWishlistItemsFromStorage();
    const albums = wishlistItems.map((item) =>
      AlbumFactory.fromBandcampItem(item),
    );
    const children: TreeItem[] = [
      AlbumTreeItemFactory.createArtistsTreeItem(albums),
      AlbumTreeItemFactory.createReleasesTreeItem(albums),
    ];

    const buttons: TreeItemButton[] = [
      createWishlistOpenTreeItemButton(username),
    ];

    if (isBandcampFanUrl(currentPageUrl, username)) {
      buttons.unshift(createWishlistRefreshTreeItemButton());
    }

    return item('Wishlist').withChildren(children).withButtons(buttons).build();
  }
}

function createWishlistOpenTreeItemButton(username: string): TreeItemButton {
  return TreeItemButtonFactory.createExternalLink(
    'Open Wishlist',
    BandcampUrlFactory.generateWishlistUrl(username),
  );
}

function createWishlistRefreshTreeItemButton(): TreeItemButton {
  return TreeItemButtonFactory.createRefreshButton(
    'Refresh',
    createLoadHandler(loadWishlistItems),
  );
}

async function loadWishlistItemsFromStorage(): Promise<BandcampItem[]> {
  return (await storage.getByKey(WISHLIST_KEY)) || [];
}

async function loadWishlistItems(): Promise<BandcampItem[]> {
  const pageCollection = new PageCollection();
  const wishlist = await pageCollection.loadWishlistItems({
    includeSummaryFlags: true,
  });
  await storage.set({ [WISHLIST_KEY]: wishlist });

  return wishlist;
}
