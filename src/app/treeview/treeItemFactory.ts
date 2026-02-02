import type { Album } from 'src/bandcamp/domain/album/album';
import { Band } from 'src/bandcamp/domain/band/band';
import { createQueryCountString } from 'src/bandcamp/domain/page/helper';
import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { Url } from 'src/bandcamp/domain/url/url';
import { History } from 'src/core/history';
import { createQueryCountMap } from 'src/utils/array';
import type { QueryCountMap } from '$lib/components/bcx';
import type { TreeItem } from './treeItem';

export class TreeItemFactory {
  static fromBrand(band: Band): TreeItem {
    const queryCountMap = createQueryCountMap(band.metadata.queries);
    const children: TreeItem[] = [];

    children.push({
      label: createQueryCountString(
        'Artist/Releases',
        band.metadata.artistNames.length,
      ),
      open: false,
      children: createBandArtistsReleasesTreeItems(band, queryCountMap),
    });

    children.push(createBandYearsTreeItem(band, queryCountMap));
    children.push(createBandKeywordsTreeItem(band, queryCountMap));

    return {
      label: band.name,
      open: true,
      children,
    };
  }

  static fromAlbum(album: Album): TreeItem {
    return {
      label: album.toString(),
      query: album.toString(),
      href: album.url.toString(),
      image: album.artwork.tinySizeUrl,
    };
  }

  static fromHistoryItem(item: chrome.history.HistoryItem): TreeItem {
    const url = item.url ? Url.parse(item.url) : undefined;

    return {
      label: item.title || item.url || 'No Title',
      href: url?.toString(),
    };
  }

  static fromDate(date: Date): TreeItem {
    const label = date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return {
      label,
    };
  }

  static async fromHistory(): Promise<TreeItem> {
    try {
      const historyItems = await History.search({
        text: 'bandcamp.com',
        maxResults: 200,
        startTime: 0,
      });
      const children: TreeItem[] = [];
      const uuids = new Set<string>();

      historyItems.forEach((item) => {
        const url = createUrlFromHistoryItem(item);

        if (!url || !url.isBandcamp || url.isRegular) {
          return;
        }

        const uuid = url.uuid;
        if (uuid && !uuids.has(uuid)) {
          uuids.add(uuid);
        }
      });

      const bandsAndAlbums: (Band | Album)[] = await BandcampStorage.getByUuids(
        Array.from(uuids),
      );
      const uuidTreeItemsMap = new Map<string, TreeItem>();

      bandsAndAlbums.forEach((entity) => {
        const treeItem =
          entity instanceof Band
            ? TreeItemFactory.fromBrand(entity)
            : TreeItemFactory.fromAlbum(entity);

        uuidTreeItemsMap.set(entity.url.uuid!, treeItem);
      });

      historyItems.forEach((item) => {
        const url = createUrlFromHistoryItem(item);
        if (!url) {
          return;
        }
        const uuid = url.uuid;
        if (!uuid || !uuids.has(uuid)) {
          return;
        }
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

      // Update labels with counts
      children.forEach((child) => {
        if (child.children) {
          child.label = createQueryCountString(
            child.label,
            child.children.length,
          );
        }
      });

      return {
        label: createQueryCountString(`History`, children.length),
        children,
      };
    } catch (error) {
      console.error(
        '[TreeItemFactory.fromHistory]',
        'Failed to load history:',
        error,
      );
      return {
        label: 'History (error)',
      };
    }
  }
}

function createBandArtistsReleasesTreeItems(
  band: Band,
  queryCountMap: QueryCountMap,
): TreeItem[] {
  const children = band.metadata.artistNames.map((artist) => {
    const count = queryCountMap.get(artist) || 0;
    const label = createQueryCountString(artist, count);
    const artistChildren: TreeItem[] = band.metadata.albums
      .filter((album) => album.artist.names.includes(artist))
      .map(TreeItemFactory.fromAlbum);

    return {
      label,
      query: artist,
      open: false,
      children: artistChildren,
    } as TreeItem;
  });

  return children;
}

function createBandYearsTreeItem(
  band: Band,
  queryCountMap: QueryCountMap,
): TreeItem {
  const children: TreeItem[] = band.metadata.years.map((year) => {
    const query = year.toString();
    const count = queryCountMap.get(query) || 0;
    const label = createQueryCountString(query, count);
    const children: TreeItem[] = band.metadata
      .albumsByYear(year)
      .map(TreeItemFactory.fromAlbum);

    return {
      label,
      query,
      children,
    };
  });

  return {
    label: createQueryCountString('Years', band.metadata.years.length),
    open: false,
    children,
  };
}

function createBandKeywordsTreeItem(
  band: Band,
  queryCountMap: QueryCountMap,
): TreeItem {
  const children: TreeItem[] = band.metadata.keywords.map((keyword) => {
    const count = queryCountMap.get(keyword) || 0;
    const label = createQueryCountString(keyword, count);

    return {
      label,
      query: keyword,
    };
  });

  return {
    label: createQueryCountString('Keywords', band.metadata.keywords.length),
    open: false,
    children,
  };
}

function createUrlFromHistoryItem(
  item: chrome.history.HistoryItem,
): Url | undefined {
  if (!item.url) {
    return undefined;
  }

  try {
    return Url.parse(item.url);
  } catch {
    return undefined;
  }
}
