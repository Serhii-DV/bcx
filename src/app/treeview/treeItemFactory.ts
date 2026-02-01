import type { Album } from 'src/bandcamp/domain/album/album';
import type { Band } from 'src/bandcamp/domain/band/band';
import { createQueryCountString } from 'src/bandcamp/domain/page/helper';
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
      open: true,
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

  static async fromHistory(): Promise<TreeItem> {
    try {
      const items = await History.search({
        text: 'bandcamp.com',
        maxResults: 200,
        startTime: 0,
      });

      return {
        label: `History (${items.length})`,
        children: items.map(TreeItemFactory.fromHistoryItem),
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
