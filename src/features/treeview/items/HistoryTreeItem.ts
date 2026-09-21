import { Album } from 'src/bandcamp/domain/album/album';
import { Band } from 'src/bandcamp/domain/band/band';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { Track } from 'src/bandcamp/domain/track/track';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import {
  isBandcampAlbumUrl,
  isBandcampMusicUrl,
  isBandcampRegularUrl,
  isBandcampTrackUrl,
  isBandcampUrl,
} from 'src/bandcamp/domain/url/helper';
import { History } from 'src/core/history';
import { Url } from 'src/core/url';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import { BandTreeItemFactory } from '../factories/BandTreeItemFactory';
import { DateTreeItemFactory } from '../factories/DateTreeItemFactory';
import { HistoryEntryTreeItemFactory } from '../factories/HistoryEntryTreeItemFactory';
import { TrackTreeItemFactory } from '../factories/TrackTreeItemFactory';
import { TREE_ITEM_LAYOUT, type TreeItem } from '../TreeItem';

type HistoryPageType = 'band' | 'release' | 'track' | 'other';

type VisitedBandcampPage = {
  item: chrome.history.HistoryItem;
  uuid: string;
  type: HistoryPageType;
};

const HISTORY_LABEL = 'History';
const LATEST_VISITED_BATCH_SIZE = 50;
const SHOW_MORE_LABEL = 'Show more';

const HISTORY_TABS: { label: string; type?: HistoryPageType }[] = [
  { label: 'All' },
  { label: 'Bands', type: 'band' },
  { label: 'Releases', type: 'release' },
  { label: 'Tracks', type: 'track' },
];

export class HistoryTreeItem {
  static async createGroupedByDays(): Promise<TreeItem> {
    try {
      const pages = await HistoryTreeItem.getUniqueVisitedBandcampPages();
      const uuidTreeItemsMap =
        await HistoryTreeItem.createUuidTreeItemsMap(pages);
      const children: TreeItem[] = [];

      pages.forEach(({ item, uuid }) => {
        const historyItem = HistoryTreeItem.createHistoryTreeItem(
          uuidTreeItemsMap,
          uuid,
          item,
        );
        const dateItem = DateTreeItemFactory.create(
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

  static async createLatestVisitedSections(
    limit = LATEST_VISITED_BATCH_SIZE,
  ): Promise<TreeItem> {
    try {
      const pages = await HistoryTreeItem.getUniqueVisitedBandcampPages();
      const tabPages = HISTORY_TABS.map(({ label, type }) => ({
        label,
        pages: type ? pages.filter((page) => page.type === type) : pages,
      }));
      const initialPages = tabPages.flatMap(({ pages }) =>
        pages.slice(0, limit),
      );
      const uniqueInitialPages = [
        ...new Map(initialPages.map((page) => [page.uuid, page])).values(),
      ];
      const initialItems =
        await HistoryTreeItem.createUuidTreeItemsMap(uniqueInitialPages);
      const children = await Promise.all(
        tabPages.map(async ({ label, pages: pagesForTab }) => ({
          label,
          childrenCount: pagesForTab.length,
          hasChildren: true,
          children: await HistoryTreeItem.createLatestVisitedChildren(
            pagesForTab,
            0,
            limit,
            initialItems,
          ),
          itemPreview: true,
          layout: TREE_ITEM_LAYOUT.BROWSER,
        })),
      );

      return { label: HISTORY_LABEL, children };
    } catch (error) {
      console.error(
        '[HistoryTreeItem.createLatestVisitedSections]',
        'Failed to load history:',
        error,
      );
      return { label: `${HISTORY_LABEL} (error)` };
    }
  }

  private static async createLatestVisitedChildren(
    pages: VisitedBandcampPage[],
    offset: number,
    limit: number,
    knownItems?: Map<string, TreeItem>,
  ): Promise<TreeItem[]> {
    const nextOffset = offset + limit;
    const pageBatch = pages.slice(offset, nextOffset);
    const uuidTreeItemsMap =
      knownItems ?? (await HistoryTreeItem.createUuidTreeItemsMap(pageBatch));
    const children = pageBatch.map(({ item, uuid }) =>
      HistoryTreeItem.createHistoryTreeItem(uuidTreeItemsMap, uuid, item),
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
      label: SHOW_MORE_LABEL,
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
          throw new Error('Cannot find parent History tree item.');
        }

        const loadMoreIndex = children.findIndex(
          (child) =>
            child === item || (!!item.path && child.path === item.path),
        );
        const nextChildren = await HistoryTreeItem.createLatestVisitedChildren(
          pages,
          offset,
          limit,
        );

        if (loadMoreIndex >= 0) {
          children.splice(loadMoreIndex, 1, ...nextChildren);
          context.focusPath = parent.path
            ? `${parent.path}.${loadMoreIndex}`
            : String(loadMoreIndex);
        } else {
          children.push(...nextChildren);
          const firstNewChildIndex = children.length - nextChildren.length;
          context.focusPath = parent.path
            ? `${parent.path}.${firstNewChildIndex}`
            : String(firstNewChildIndex);
        }

        parent.children = children;
      } catch (error) {
        console.error(
          '[HistoryTreeItem.createLoadMoreTreeItem]',
          'Failed to load more history:',
          error,
        );
        item.label = `${SHOW_MORE_LABEL} (error)`;
        context.showFeedback?.('Error loading');
      } finally {
        item.isLoadingChildren = false;
      }
    };

    return loadMoreTreeItem;
  }

  private static createHistoryTreeItem(
    treeItems: Map<string, TreeItem>,
    uuid: string,
    historyItem: chrome.history.HistoryItem,
  ): TreeItem {
    const storedTreeItem = treeItems.get(uuid);

    return storedTreeItem
      ? HistoryEntryTreeItemFactory.withVisitTime(storedTreeItem, historyItem)
      : HistoryEntryTreeItemFactory.create(historyItem);
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
        pages.push({
          item,
          uuid,
          type: HistoryTreeItem.getHistoryPageType(item),
        });

        return pages;
      }, []);
  }

  private static getHistoryPageType(
    item: chrome.history.HistoryItem,
  ): HistoryPageType {
    const url = Url.fromHistoryItem(item);
    if (!url) return 'other';
    if (isBandcampMusicUrl(url)) return 'band';
    if (isBandcampAlbumUrl(url)) return 'release';
    if (isBandcampTrackUrl(url)) return 'track';
    return 'other';
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
    const entities: (Band | Album | Track)[] = await BandcampStorage.getByUuids(
      pages.map((page) => page.uuid),
    );
    const uuidTreeItemsMap = new Map<string, TreeItem>();

    entities.forEach((entity) => {
      const treeItem =
        entity instanceof Band
          ? BandTreeItemFactory.createWithPreview(entity)
          : entity instanceof Album
            ? AlbumTreeItemFactory.createWithPreview(entity)
            : TrackTreeItemFactory.createWithPreview(entity);

      if (entity.url) uuidTreeItemsMap.set(entity.url.uuid, treeItem);
    });

    return uuidTreeItemsMap;
  }
}
