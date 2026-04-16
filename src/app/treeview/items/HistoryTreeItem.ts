import type { Album } from 'src/bandcamp/domain/album/album';
import { Band } from 'src/bandcamp/domain/band/band';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import {
  isBandcampRegularUrl,
  isBandcampUrl,
} from 'src/bandcamp/domain/url/helper';
import { History } from 'src/core/history';
import { Url } from 'src/core/url';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import type { TreeItem } from '../TreeItem';
import { TreeItemFactory } from '../TreeItemFactory';

type VisitedBandcampPage = {
  item: chrome.history.HistoryItem;
  uuid: string;
};

const HISTORY_LABEL = 'History';
const LATEST_VISITED_BATCH_SIZE = 20;
const LOAD_MORE_LABEL = 'Load more';

export class HistoryTreeItem {
  static async createGroupedByDays(): Promise<TreeItem> {
    try {
      const pages = await HistoryTreeItem.getUniqueVisitedBandcampPages();
      const uuidTreeItemsMap =
        await HistoryTreeItem.createUuidTreeItemsMap(pages);
      const children: TreeItem[] = [];

      pages.forEach(({ item, uuid }) => {
        const historyItem =
          uuidTreeItemsMap.get(uuid) || TreeItemFactory.fromHistoryItem(item);
        const dateItem = TreeItemFactory.fromDate(
          new Date(item.lastVisitTime as number),
        );
        const childrenDateItem = children.find(
          (child) => child.label === dateItem.label,
        );

        if (childrenDateItem) {
          childrenDateItem.children = childrenDateItem.children || [];
          const childrenHistoryItem = childrenDateItem.children.find(
            (child) => child.label === historyItem.label,
          );

          if (childrenHistoryItem) {
            return;
          }

          childrenDateItem.children!.push(historyItem);
        } else {
          children.push({
            ...dateItem,
            children: [historyItem],
          });
        }
      });

      return {
        label: HISTORY_LABEL,
        children,
      };
    } catch (error) {
      console.error(
        '[HistoryTreeItem.createGroupedByDays]',
        'Failed to load history:',
        error,
      );
      return {
        label: `${HISTORY_LABEL} (error)`,
      };
    }
  }

  static async createLatestVisited(
    limit = LATEST_VISITED_BATCH_SIZE,
  ): Promise<TreeItem> {
    try {
      const pages = await HistoryTreeItem.getUniqueVisitedBandcampPages();
      const historyTreeItem: TreeItem = {
        label: HISTORY_LABEL,
        children: [],
      };

      historyTreeItem.children =
        await HistoryTreeItem.createLatestVisitedChildren(pages, 0, limit);

      return historyTreeItem;
    } catch (error) {
      console.error(
        '[HistoryTreeItem.createLatestVisited]',
        'Failed to load history:',
        error,
      );
      return {
        label: `${HISTORY_LABEL} (error)`,
      };
    }
  }

  private static async createLatestVisitedChildren(
    pages: VisitedBandcampPage[],
    offset: number,
    limit: number,
  ): Promise<TreeItem[]> {
    const nextOffset = offset + limit;
    const pageBatch = pages.slice(offset, nextOffset);
    const uuidTreeItemsMap =
      await HistoryTreeItem.createUuidTreeItemsMap(pageBatch);
    const children = pageBatch.map(
      ({ item, uuid }) =>
        uuidTreeItemsMap.get(uuid) || TreeItemFactory.fromHistoryItem(item),
    );

    if (nextOffset < pages.length) {
      children.push(
        HistoryTreeItem.createLoadMoreTreeItem(pages, nextOffset, limit),
      );
    }

    return children;
  }

  private static createLoadMoreTreeItem(
    pages: VisitedBandcampPage[],
    offset: number,
    limit: number,
  ): TreeItem {
    const loadMoreTreeItem: TreeItem = {
      label: LOAD_MORE_LABEL,
      includeInFilterSuggestions: false,
    };

    loadMoreTreeItem.onClick = async ({ item, parent }) => {
      if (item.isLoadingChildren) {
        return;
      }

      item.isLoadingChildren = true;
      item.label = 'Loading...';

      try {
        const children = parent?.children;

        if (!children) {
          throw new Error('Cannot find parent History tree item.');
        }

        const loadMoreIndex = children.indexOf(item);
        const nextChildren = await HistoryTreeItem.createLatestVisitedChildren(
          pages,
          offset,
          limit,
        );

        if (loadMoreIndex >= 0) {
          children.splice(loadMoreIndex, 1, ...nextChildren);
        } else {
          children.push(...nextChildren);
        }

        parent.children = children;
      } catch (error) {
        console.error(
          '[HistoryTreeItem.createLoadMoreTreeItem]',
          'Failed to load more history:',
          error,
        );
        item.label = `${LOAD_MORE_LABEL} (error)`;
      } finally {
        item.isLoadingChildren = false;
      }
    };

    return loadMoreTreeItem;
  }

  private static async getUniqueVisitedBandcampPages(): Promise<
    VisitedBandcampPage[]
  > {
    const historyItems = await History.search({
      text: 'bandcamp.com',
      maxResults: 1000,
      startTime: 0,
    });
    const uuids = new Set<string>();

    return historyItems
      .sort(
        (itemA, itemB) =>
          (itemB.lastVisitTime || 0) - (itemA.lastVisitTime || 0),
      )
      .reduce<VisitedBandcampPage[]>((pages, item) => {
        const uuid = HistoryTreeItem.getBandcampPageUuid(item);

        if (!uuid || uuids.has(uuid)) {
          return pages;
        }

        uuids.add(uuid);
        pages.push({ item, uuid });

        return pages;
      }, []);
  }

  private static getBandcampPageUuid(
    item: chrome.history.HistoryItem,
  ): string | null {
    const url = Url.fromHistoryItem(item);

    if (!url || !isBandcampUrl(url) || isBandcampRegularUrl(url)) {
      return null;
    }

    return BandcampUrlFactory.create(url).uuid;
  }

  private static async createUuidTreeItemsMap(
    pages: VisitedBandcampPage[],
  ): Promise<Map<string, TreeItem>> {
    const bandsAndAlbums: (Band | Album)[] = await BandcampStorage.getByUuids(
      pages.map((page) => page.uuid),
    );
    const uuidTreeItemsMap = new Map<string, TreeItem>();

    bandsAndAlbums.forEach((entity) => {
      const treeItem =
        entity instanceof Band
          ? TreeItemFactory.fromBand(entity)
          : AlbumTreeItemFactory.create(entity);

      uuidTreeItemsMap.set(entity.url.uuid!, treeItem);
    });

    return uuidTreeItemsMap;
  }
}
