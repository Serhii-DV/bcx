import type { Band } from 'src/bandcamp/domain/band/band';
import type { TreeItem } from '../TreeItem';
import { TreeItemFactory } from '../TreeItemFactory';
import { updateTreeItemsQueryFromLabel } from '../utils';

export class BandTreeItem {
  static create(band: Band, withChildren: boolean = true): TreeItem {
    const children: TreeItem[] = [];

    if (withChildren) {
      const albumTreeItems = TreeItemFactory.fromAlbumsByArtistNames(
        band.metadata.albums,
      );
      children.push({
        label: 'Artist/Releases',
        open: false,
        children: updateTreeItemsQueryFromLabel(albumTreeItems),
      });

      children.push(createBandYearsTreeItem(band));
      children.push(createBandKeywordsTreeItem(band));
    }

    return {
      label: band.name,
      image: band.artwork.tinySizeUrl,
      open: withChildren,
      href: !withChildren ? band.url.toString() : undefined,
      children: children,
    };
  }
}

function createBandYearsTreeItem(band: Band): TreeItem {
  const children: TreeItem[] = band.metadata.years.map((year) => {
    const children: TreeItem[] = band.metadata
      .albumsByYear(year)
      .map(TreeItemFactory.fromAlbum);

    return {
      label: year.toString(),
      children: updateTreeItemsQueryFromLabel(children),
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
    return { label: keyword };
  });

  return {
    label: 'Keywords',
    open: false,
    children: updateTreeItemsQueryFromLabel(children),
  };
}
