import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import {
  type BandcampItem,
  PageCollection,
} from 'src/bandcamp/domain/page/PageCollection';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { isBandcampFanUrl } from 'src/bandcamp/domain/url/helper';
import { currentPageUrl } from 'src/core/shared';
import { TreeItemButtonFactory } from '../../buttons/factory';
import type { TreeItem } from '../../TreeItem';
import { item } from '../../TreeItemBuilder';
import type { TreeItemButton } from '../../TreeItemButton';
import { createLoadHandler } from '../../utils';
import { withReleaseCatalog } from '../releaseCatalog';
import { clearCollectionReleaseYears } from './releaseYears';
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
    if (isBandcampFanUrl(currentPageUrl, username)) {
      builder.addButton(createCollectionRefreshTreeItemButton());
    }

    builder.addButton(createCollectionOpenTreeItemButton(username));

    return withReleaseCatalog(builder.build(), albums, {
      collectionAddedAt: collectionItems.map((item) => {
        if (!item.purchased?.trim()) return null;
        const date = new Date(item.purchased);
        return Number.isNaN(date.getTime()) ? null : date.toISOString();
      }),
    });
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
  await clearCollectionReleaseYears();

  return collection;
}
