import type { Band } from 'src/bandcamp/domain/band/band';
import { createQueryCountString } from 'src/bandcamp/domain/page/helper';
import { createQueryCountMap } from 'src/utils/array';
import type { QueryCountMap } from '$lib/components/bcx';
import type { TreeItem } from '../treeItem';
import { TreeItemFactory } from '../treeItemFactory';

export class BandTreeItem {
  static create(band: Band, withChildren: boolean = true): TreeItem {
    const queryCountMap = createQueryCountMap(band.metadata.queries);
    const children: TreeItem[] = [];

    if (withChildren) {
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
    }

    return {
      label: band.name,
      image: band.artwork.tinySizeUrl,
      open: withChildren,
      href: !withChildren ? band.url.toString() : undefined,
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
