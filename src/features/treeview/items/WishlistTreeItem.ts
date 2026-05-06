import type { Album } from 'src/bandcamp/domain/album/album';
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
import { ICON_MIC } from '../utils/icon';
import { createPagedTreeItem } from './createPagedTreeItem';
import { createPagedReleasesTreeItem } from './pagedReleasesTreeItem';

const WISHLIST_KEY = '/wishlist';
const ARTISTS_BATCH_SIZE = 20;

export class WishlistTreeItem {
  static async create(username: string): Promise<TreeItem> {
    const builder = item('Wishlist');
    const wishlistItems = await loadWishlistItemsFromStorage();
    const albums = wishlistItems.map((item) =>
      AlbumFactory.fromBandcampItem(item),
    );
    builder.add(
      this.createArtistsTreeItem(albums),
      this.createReleasesTreeItem(albums),
    );

    if (isBandcampFanUrl(currentPageUrl, username)) {
      builder.addButton(createWishlistRefreshTreeItemButton());
    }

    builder.addButton(createWishlistOpenTreeItemButton(username));

    return builder.build();
  }

  private static createReleasesTreeItem(albums: Album[]): TreeItem {
    return createPagedReleasesTreeItem({
      albums,
      errorContext: '[WishlistTreeItem.createLoadMoreReleasesTreeItem]',
    });
  }

  private static createArtistsTreeItem(albums: Album[]): TreeItem {
    const artistItems = AlbumTreeItemFactory.fromAlbumsByArtistReleases(albums);

    return createPagedTreeItem({
      batchSize: ARTISTS_BATCH_SIZE,
      errorContext: '[WishlistTreeItem.createLoadMoreArtistsTreeItem]',
      errorMessage: 'Failed to load more wishlist artists:',
      image: ICON_MIC,
      items: artistItems,
      label: 'Artists',
      childrenImage: ICON_MIC,
      createChildren: (artistItems) => artistItems,
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

  return wishlist;
}
