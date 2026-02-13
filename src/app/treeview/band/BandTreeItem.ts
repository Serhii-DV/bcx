import type { Band } from 'src/bandcamp/domain/band/band';
import type { TreeItem } from '../treeItem';
import { TreeItemFactory } from '../treeItemFactory';
import { updateTreeItemsCounts } from '../utils';

export class BandTreeItem {
  static create(band: Band, withChildren: boolean = true): TreeItem {
    const children: TreeItem[] = [];

    if (withChildren) {
      children.push({
        label: 'Artist/Releases',
        open: false,
        children: createBandArtistsReleasesTreeItems(band),
      });

      children.push(createBandYearsTreeItem(band));
      children.push(createBandKeywordsTreeItem(band));
    }

    return {
      label: band.name,
      image: band.artwork.tinySizeUrl,
      open: withChildren,
      href: !withChildren ? band.url.toString() : undefined,
      children: updateTreeItemsCounts(children),
    };
  }
}

function createBandArtistsReleasesTreeItems(band: Band): TreeItem[] {
  const children = band.metadata.artistNames.map((artist) => {
    const artistChildren: TreeItem[] = band.metadata.albums
      .filter((album) => album.artist.names.includes(artist))
      .map(TreeItemFactory.fromAlbum);

    return {
      label: artist,
      query: artist,
      open: false,
      children: artistChildren,
    } as TreeItem;
  });

  return children;
}

function createBandYearsTreeItem(band: Band): TreeItem {
  const children: TreeItem[] = band.metadata.years.map((year) => {
    const query = year.toString();
    const children: TreeItem[] = band.metadata
      .albumsByYear(year)
      .map(TreeItemFactory.fromAlbum);

    return {
      label: query,
      query,
      children,
    };
  });

  return {
    label: 'Years',
    open: false,
    children,
  };
}

function createBandKeywordsTreeItem(band: Band): TreeItem {
  const children: TreeItem[] = band.metadata.keywords.map((keyword) => {
    return {
      label: keyword,
      query: keyword,
    };
  });

  return {
    label: 'Keywords',
    open: false,
    children,
  };
}
