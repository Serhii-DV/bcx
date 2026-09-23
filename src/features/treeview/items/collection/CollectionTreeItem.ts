import { AlbumFactory } from 'src/bandcamp/domain/album/factory';
import {
  type BandcampItem,
  PageCollection,
} from 'src/bandcamp/domain/page/PageCollection';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { isBandcampFanUrl } from 'src/bandcamp/domain/url/helper';
import { currentPageUrl } from 'src/core/shared';
import { console } from 'src/utils/console';
import { TreeItemButtonFactory } from '../../buttons/factory';
import type { TreeItem } from '../../TreeItem';
import { item } from '../../TreeItemBuilder';
import type { TreeItemButton } from '../../TreeItemButton';
import { createLoadHandler } from '../../utils';
import { withReleaseCatalog } from '../releaseCatalog';
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
    const storedAlbums = await BandcampStorage.getAlbumsRawDataByIds(
      albums.map((album) => album.id),
    ).catch((error) => {
      console.warn('[Collection] Stored album lookup failed:', error);
      return [];
    });
    const releaseDatesById = new Map(
      storedAlbums.map((album) => [album.id, album.metadata?.published]),
    );
    if (isBandcampFanUrl(currentPageUrl, username)) {
      builder.addButton(createCollectionRefreshTreeItemButton());
    }

    builder.addButton(createCollectionOpenTreeItemButton(username));

    return withReleaseCatalog(builder.build(), albums, {
      addedAt: collectionItems.map((item) => {
        if (!item.purchased?.trim()) return null;
        const date = new Date(item.purchased);
        return Number.isNaN(date.getTime()) ? null : date.toISOString();
      }),
      addedYearSource: 'collection',
      releaseDates: albums.map((album) => {
        const published = releaseDatesById.get(album.id);
        if (!published) return null;
        const date = new Date(published);
        return Number.isNaN(date.getTime()) ? null : date.toISOString();
      }),
      showReleaseDate: true,
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

  return collection;
}
