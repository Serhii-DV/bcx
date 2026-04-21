import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import {
  type BandcampItem,
  PageCollection,
} from 'src/bandcamp/domain/page/PageCollection';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { isBandcampFanUrl } from 'src/bandcamp/domain/url/helper';
import { currentPageUrl } from 'src/core/shared';
import { TreeItemButtonFactory } from '../../buttons/factory';
import { AlbumTreeItemFactory } from '../../factories/AlbumTreeItemFactory';
import type { TreeItem } from '../../TreeItem';
import type { TreeItemButton } from '../../TreeItemButton';
import { createLoadHandler } from '../../utils';
import {
  loadCollectionItemsFromStorage,
  saveCollectionItemsToStorage,
} from './storage';

export class CollectionTreeItem {
  static async create(username: string): Promise<TreeItem> {
    const collectionItems = await loadCollectionItemsFromStorage();
    const albums = collectionItems.map((item) =>
      AlbumFactory.fromBandcampItem(item),
    );
    const children: TreeItem[] = [
      AlbumTreeItemFactory.createArtistsTreeItem(albums),
      AlbumTreeItemFactory.createReleasesTreeItem(albums),
    ];

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

async function loadCollectionItems(): Promise<BandcampItem[]> {
  const pageCollection = new PageCollection();
  const collection = await pageCollection.loadCollectionItems({
    includeSummaryFlags: true,
  });
  await saveCollectionItemsToStorage(collection);

  return collection;
}
