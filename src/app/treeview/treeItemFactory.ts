import type { Band } from 'src/bandcamp/domain/band/band';
import { createQueryCountString } from 'src/bandcamp/domain/page/helper';
import type { QueryCountMap } from '$lib/components/bcx';
import type { TreeItem } from './treeItem';

export class TreeItemFactory {
  static fromBand(band: Band, queryCountMap: QueryCountMap): TreeItem {
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
}

function createBandArtistsReleasesTreeItems(
  band: Band,
  queryCountMap: QueryCountMap,
): TreeItem[] {
  const children = band.metadata.artistNames.map((artist) => {
    const count = queryCountMap.get(artist) || 0;
    const label = createQueryCountString(artist, count);
    const artistChildren: TreeItem[] = [];

    band.metadata.albums.forEach((album) => {
      if (album.artist.names.includes(artist)) {
        artistChildren.push({
          label: album.toString(),
          query: album.toString(),
          href: album.url.toString(),
        });
      }
    });

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
    const count = queryCountMap.get(year) || 0;
    const label = createQueryCountString(year.toString(), count);

    return {
      label,
      query: year.toString(),
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
