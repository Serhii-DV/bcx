import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import {
  type BandcampItem,
  PageCollection,
} from 'src/bandcamp/domain/page/PageCollection';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { isBandcampFanUrl } from 'src/bandcamp/domain/url/helper';
import { currentPageUrl, storage } from 'src/core/shared';
import { TreeItemButtonFactory } from '../buttons/factory';
import type { TreeItem } from '../TreeItem';
import { item } from '../TreeItemBuilder';
import type { TreeItemButton } from '../TreeItemButton';
import { createLoadHandler } from '../utils';
import { withReleaseCatalog } from './releaseCatalog';
import { clearReleaseYears } from './releaseYears';

const WISHLIST_KEY = '/wishlist';

export class WishlistTreeItem {
  static async create(username: string): Promise<TreeItem> {
    const builder = item('Wishlist');
    const wishlistItems = await loadWishlistItemsFromStorage();
    const albums = wishlistItems.map((item) =>
      AlbumFactory.fromBandcampItem(item),
    );
    if (isBandcampFanUrl(currentPageUrl, username)) {
      builder.addButton(createWishlistRefreshTreeItemButton());
    }

    builder.addButton(createWishlistOpenTreeItemButton(username));

    return withReleaseCatalog(builder.build(), albums, {
      paginateReleases: false,
      addedAt: wishlistItems.map((item) => {
        if (!item.added?.trim()) return null;
        const date = new Date(item.added);
        return Number.isNaN(date.getTime()) ? null : date.toISOString();
      }),
      addedYearSource: 'wishlist',
    });
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
  await clearReleaseYears('wishlist');

  return wishlist;
}
