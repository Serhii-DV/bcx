import { Album } from 'src/bandcamp/domain/album/album';
import {
  type BandcampItem,
  PageCollection,
} from 'src/bandcamp/domain/page/PageCollection';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { storage } from 'src/core/shared';
import type { TreeItem } from '../treeview/treeItem';
import { TreeItemFactory } from '../treeview/treeItemFactory';

const WISHLIST_KEY = '/wishlist';

export class Wishlist {
  static async createWishlistTreeItems(username: string): Promise<TreeItem> {
    const wishlistItems = await loadWishlistItemsFromStorage();
    const treeItems: TreeItem[] = wishlistItems.map((item: BandcampItem) => {
      const album = Album.create(
        item.item_url,
        item.band_name,
        item.item_title,
        item.album_id,
        item.item_art_id,
        item.band_id,
      );
      return TreeItemFactory.fromAlbum(album);
    });

    treeItems.unshift({
      label: 'Refresh',
      onClick: async (element: HTMLElement) => {
        if (element.dataset.loading === 'true') {
          return;
        }

        element.textContent = 'Loading...';
        element.dataset.loading = 'true';

        const wishlistItems = await loadWishlistItems();

        element.textContent = 'Loaded ' + wishlistItems.length + ' items';
        element.dataset.loading = 'false';
      },
    });

    return {
      label: `Wishlist`,
      href: BandcampUrlFactory.generateWishlistUrl(username),
      children: treeItems,
    };
  }
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
