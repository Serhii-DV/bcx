import { Album } from 'src/bandcamp/domain/album/album';
import {
  type BandcampItem,
  PageCollection,
} from 'src/bandcamp/domain/page/PageCollection';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { storage } from 'src/core/shared';
import type { TreeItem } from '../TreeItem';
import { TreeItemFactory } from '../TreeItemFactory';

const COLLECTION_KEY = '/collection';

export class CollectionTreeItem {
  static async create(username: string): Promise<TreeItem> {
    const collectionItems = await loadCollectionItemsFromStorage();
    const albums = collectionItems.map((item) =>
      Album.create(
        item.item_url,
        item.band_name,
        item.item_title,
        item.album_id,
        item.item_art_id,
        item.band_id,
      ),
    );
    const treeItems: TreeItem[] =
      TreeItemFactory.fromAlbumsByArtistNames(albums);

    treeItems.unshift({
      label: 'Refresh',
      onClick: async (element: HTMLElement) => {
        if (element.dataset.loading === 'true') {
          return;
        }

        element.textContent = 'Loading...';
        element.dataset.loading = 'true';

        const collectionItems = await loadCollectionItems();

        element.textContent = 'Loaded ' + collectionItems.length + ' items';
        element.dataset.loading = 'false';
      },
    });

    return {
      label: `Collection`,
      href: BandcampUrlFactory.generateCollectionUrl(username),
      children: treeItems,
    };
  }
}

async function loadCollectionItemsFromStorage(): Promise<BandcampItem[]> {
  return (await storage.getByKey(COLLECTION_KEY)) || [];
}

async function loadCollectionItems(): Promise<BandcampItem[]> {
  const pageCollection = new PageCollection();
  const collection = await pageCollection.loadCollectionItems({
    includeSummaryFlags: true,
  });
  await storage.set({ [COLLECTION_KEY]: collection });

  return collection;
}
