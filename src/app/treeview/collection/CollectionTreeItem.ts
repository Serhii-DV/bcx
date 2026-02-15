import { ExternalLink, RefreshCcw } from 'lucide-svelte';
import { Album } from 'src/bandcamp/domain/album/album';
import {
  type BandcampItem,
  PageCollection,
} from 'src/bandcamp/domain/page/PageCollection';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { isBandcampFanUrl } from 'src/bandcamp/domain/url/helper';
import { currentPageUrl, storage } from 'src/core/shared';
import type { TreeItem } from '../TreeItem';
import type { TreeItemButton } from '../TreeItemButton';
import { TreeItemFactory } from '../TreeItemFactory';
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
      TreeItemFactory.fromAlbumsByArtistNames(albums);

    const buttons: TreeItemButton[] = [
      createCollectionOpenTreeItemButton(username),
    ];

    if (isBandcampFanUrl(currentPageUrl, username)) {
      buttons.unshift(createCollectionRefreshTreeItemButton());
    }

    return {
      label: `Collection`,
      children,
      buttons,
    };
  }
}

function createCollectionOpenTreeItemButton(username: string): TreeItemButton {
  return {
    title: 'Open Collection',
    icon: ExternalLink,
    href: BandcampUrlFactory.generateCollectionUrl(username),
  };
}

function createCollectionRefreshTreeItemButton(): TreeItemButton {
  return {
    title: 'Refresh Collection',
    icon: RefreshCcw,
    onClick: createLoadHandler(loadCollectionItems),
  };
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
