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
import { BandTreeItem } from '../band/BandTreeItem';
import type { TreeItem } from '../treeItem';
import { TreeItemFactory } from '../treeItemFactory';

export class HistoryTreeItem {
  static fromHistoryItem(item: chrome.history.HistoryItem): TreeItem {
    return {
      label: item.title || item.url || 'No Title',
      href: Url.fromHistoryItem(item)?.toString(),
    };
  }

  static async create(): Promise<TreeItem> {
    try {
      const historyItems = await History.search({
        text: 'bandcamp.com',
        maxResults: 1000,
        startTime: 0,
      });
      const children: TreeItem[] = [];
      const uuids = new Set<string>();

      historyItems.forEach((item) => {
        let url = Url.fromHistoryItem(item);

        if (!url || !isBandcampUrl(url) || isBandcampRegularUrl(url)) {
          return;
        }

        url = BandcampUrlFactory.create(url);
        const uuid = url.uuid;

        if (uuids.has(uuid)) {
          return;
        }

        uuids.add(uuid);
      });

      const bandsAndAlbums: (Band | Album)[] = await BandcampStorage.getByUuids(
        Array.from(uuids),
      );
      const uuidTreeItemsMap = new Map<string, TreeItem>();

      bandsAndAlbums.forEach((entity) => {
        const treeItem =
          entity instanceof Band
            ? BandTreeItem.create(entity, false)
            : TreeItemFactory.fromAlbum(entity);

        uuidTreeItemsMap.set(entity.url.uuid!, treeItem);
      });

      historyItems.forEach((item) => {
        const url = Url.fromHistoryItem(item);
        if (!url) {
          return;
        }
        const uuid = url.uuid;
        if (!uuids.has(uuid)) {
          return;
        }
        const historyItem =
          uuidTreeItemsMap.get(uuid) || HistoryTreeItem.fromHistoryItem(item);
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
        label: 'History',
        children,
      };
    } catch (error) {
      console.error(
        '[HistoryTreeItem.create]',
        'Failed to load history:',
        error,
      );
      return {
        label: 'History (error)',
      };
    }
  }
}
