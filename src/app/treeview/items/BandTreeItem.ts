import type { Band } from 'src/bandcamp/domain/band/band';
import type { TreeItem } from '../TreeItem';
import { TreeItemFactory } from '../TreeItemFactory';
import { setTreeItemsQueryFromLabel } from '../utils';
import { AlbumTreeItem } from './AlbumTreeItem';

export class BandTreeItem {
  static create(band: Band): TreeItem {
    const treeItem = TreeItemFactory.fromBand(band);
    const children: TreeItem[] = [];

    children.push({
      label: 'Artists',
      children: AlbumTreeItem.createTreeItemsFromAlbumsByArtistReleases(
        band.metadata.albums,
      ),
    });

    treeItem.href = undefined;
    treeItem.children = setTreeItemsQueryFromLabel(children);

    return treeItem;
  }

  static createBandYearsTreeItem(
    band: Band,
    label: string = 'Years',
  ): TreeItem {
    const children: TreeItem[] = band.metadata.years.reverse().map((year) => {
      const children: TreeItem[] = band.metadata
        .albumsByYear(year)
        .map(TreeItemFactory.fromAlbum);

      return {
        label: year.toString(),
        children: setTreeItemsQueryFromLabel(children),
      };
    });

    return {
      label,
      open: false,
      children,
    };
  }
}
