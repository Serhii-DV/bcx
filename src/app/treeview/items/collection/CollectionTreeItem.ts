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
import { item } from '../../TreeItemBuilder';
import type { TreeItemButton } from '../../TreeItemButton';
import { createLoadHandler } from '../../utils';
import {
  loadCollectionItemsFromStorage,
  saveCollectionItemsToStorage,
} from './storage';

export class CollectionTreeItem {
  static async create(username: string): Promise<TreeItem> {
    const builder = item('Collection');
    const collectionItems = await loadCollectionItemsFromStorage();
    const albums = collectionItems.map((item) =>
      AlbumFactory.fromBandcampItem(item),
    );
    builder.add(
      AlbumTreeItemFactory.createArtistsTreeItem(albums),
      AlbumTreeItemFactory.createReleasesTreeItem(albums),
    );

    if (isBandcampFanUrl(currentPageUrl, username)) {
      builder.addButton(createCollectionRefreshTreeItemButton());
    }

    builder.addButton(createCollectionOpenTreeItemButton(username));

    return builder.build();
  }
}

function createCollectionOpenTreeItemButton(username: string): TreeItemButton {
  return TreeItemButtonFactory.createExternalLink(
    'Open Collection',
    BandcampUrlFactory.generateFanUrl(username),
  );
}

function createCollectionRefreshTreeItemButton(): TreeItemButton {
  return TreeItemButtonFactory.createRefreshButton(
    'Refresh Collection',
    createLoadHandler(loadCollectionItems),
  );
}

async function loadCollectionItems(): Promise<BandcampItem[]> {
  const pageCollection = new PageCollection();
  const collection = await pageCollection.loadCollectionItems({
    includeSummaryFlags: true,
  });
  await saveCollectionItemsToStorage(collection);

  return collection;
}
