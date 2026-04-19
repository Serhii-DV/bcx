import { ExternalLink, RefreshCcw } from '@lucide/svelte';
import { Album } from 'src/bandcamp/domain/album/album';
import {
  type BandcampItem,
  PageCollection,
} from 'src/bandcamp/domain/page/PageCollection';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { isBandcampFanUrl } from 'src/bandcamp/domain/url/helper';
import { currentPageUrl, storage } from 'src/core/shared';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import type { TreeItem } from '../TreeItem';
import { TreeItemBuilder } from '../TreeItemBuilder';
import type { TreeItemButton } from '../TreeItemButton';
import { createLoadHandler } from '../utils';
import { ICON_DISC, ICON_MIC } from '../utils/icon';

const WISHLIST_KEY = '/wishlist';

export class WishlistTreeItem {
  static async create(username: string): Promise<TreeItem> {
    const wishlistItems = await loadWishlistItemsFromStorage();
    const albums = wishlistItems.map((item) =>
      Album.create(
        item.item_url,
        item.band_name,
        item.item_title,
        item.album_id,
        item.item_art_id,
        item.band_id,
      ),
    );
    const children: TreeItem[] = [
      this.createArtistsTreeItem(albums),
      this.createReleasesTreeItem(albums),
    ];

    const buttons: TreeItemButton[] = [
      createWishlistOpenTreeItemButton(username),
    ];

    if (isBandcampFanUrl(currentPageUrl, username)) {
      buttons.unshift(createWishlistRefreshTreeItemButton());
    }

    return {
      label: `Wishlist`,
      children,
      buttons,
    };
  }

  private static createArtistsTreeItem(albums: Album[]): TreeItem {
    return TreeItemBuilder.items(
      'Artists',
      AlbumTreeItemFactory.fromAlbumsByArtistReleases(albums),
    )
      .withImage(ICON_MIC)
      .build();
  }

  private static createReleasesTreeItem(albums: Album[]): TreeItem {
    return TreeItemBuilder.items(
      'Releases',
      AlbumTreeItemFactory.fromAlbums(albums),
    )
      .withImage(ICON_DISC)
      .build();
  }
}

function createWishlistOpenTreeItemButton(username: string): TreeItemButton {
  return {
    title: 'Open Wishlist',
    icon: ExternalLink,
    href: BandcampUrlFactory.generateWishlistUrl(username),
  };
}

function createWishlistRefreshTreeItemButton(): TreeItemButton {
  return {
    title: 'Refresh',
    icon: RefreshCcw,
    onClick: createLoadHandler(loadWishlistItems),
  };
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
