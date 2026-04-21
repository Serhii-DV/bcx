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
import { item, items } from '../TreeItemBuilder';
import type { TreeItemButton } from '../TreeItemButton';
import { createLoadHandler } from '../utils';
import { ICON_CHEVRONS_DOWN, ICON_MIC } from '../utils/icon';
import { createPagedReleasesTreeItem } from './pagedReleasesTreeItem';

const WISHLIST_KEY = '/wishlist';
const ARTISTS_BATCH_SIZE = 20;
const LOAD_MORE_LABEL = 'Load more';

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

    return items('Artists', this.createArtistsChildrenPage(artistItems, 0))
      .withImage(ICON_MIC)
      .withChildrenImage(ICON_MIC)
      .apply((treeItem) => {
        treeItem.childrenCount = artistItems.length;
      })
      .build();
  }

  private static createArtistsChildrenPage(
    artistItems: TreeItem[],
    offset: number,
    limit: number = ARTISTS_BATCH_SIZE,
  ): TreeItem[] {
    const nextOffset = offset + limit;
    const children = artistItems.slice(offset, nextOffset);

    if (nextOffset < artistItems.length) {
      children.push(
        this.createLoadMoreArtistsTreeItem(artistItems, nextOffset, limit),
      );
    }

    return children;
  }

  private static createLoadMoreArtistsTreeItem(
    artistItems: TreeItem[],
    offset: number,
    limit: number,
  ): TreeItem {
    const loadMoreTreeItem: TreeItem = {
      label: this.createLoadMoreLabel(offset, artistItems.length),
      image: ICON_CHEVRONS_DOWN,
      includeInFilterSuggestions: false,
    };

    loadMoreTreeItem.onClick = async (context) => {
      const { item } = context;
      const parent = context.parent ?? context.findParentByPath?.(item.path);

      if (item.isLoadingChildren) {
        return;
      }

      item.isLoadingChildren = true;
      context.showFeedback?.('Loading...', 0);

      try {
        const children = parent?.children;

        if (!children) {
          throw new Error('Cannot find parent Artists tree item.');
        }

        const loadMoreIndex = children.findIndex(
          (child) => child === item || child.path === item.path,
        );
        const nextChildren = this.createArtistsChildrenPage(
          artistItems,
          offset,
          limit,
        );

        if (loadMoreIndex >= 0) {
          children.splice(loadMoreIndex, 1, ...nextChildren);
          context.focusPath = parent.path
            ? `${parent.path}.${loadMoreIndex}`
            : undefined;
        } else {
          children.push(...nextChildren);
          context.focusPath = parent.path
            ? `${parent.path}.${children.length - nextChildren.length}`
            : undefined;
        }

        parent.children = children;
      } catch (error) {
        console.error(
          '[WishlistTreeItem.createLoadMoreArtistsTreeItem]',
          'Failed to load more wishlist artists:',
          error,
        );
        item.label = `${this.createLoadMoreLabel(offset, artistItems.length)} (error)`;
        context.showFeedback?.('Error loading');
      } finally {
        item.isLoadingChildren = false;
      }
    };

    return loadMoreTreeItem;
  }

  private static createLoadMoreLabel(
    loadedCount: number,
    totalCount: number,
  ): string {
    return `${LOAD_MORE_LABEL} (${loadedCount} of ${totalCount} loaded)`;
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
