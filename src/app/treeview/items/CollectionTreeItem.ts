import { Album } from 'src/bandcamp/domain/album/album';
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
import type { TreeItemButton } from '../TreeItemButton';
import { createLoadHandler } from '../utils';

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
    const children: TreeItem[] =
      AlbumTreeItemFactory.fromAlbumsByArtistNames(albums);

    const buttons: TreeItemButton[] = [
      TreeItemButtonFactory.createExternalLink(
        'Open Collection',
        BandcampUrlFactory.generateFanUrl(username),
      ),
    ];

    if (isBandcampFanUrl(currentPageUrl, username)) {
      buttons.unshift(
        TreeItemButtonFactory.createRefreshButton(
          'Refresh Collection',
          createLoadHandler(loadCollectionItems),
        ),
      );
    }

    return {
      label: `Collection`,
      children,
      buttons,
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
