import type { Band } from 'src/bandcamp/domain/band/band';
import type { TreeItem } from '../TreeItem';
import { TreeItemFactory } from '../TreeItemFactory';
import { setTreeItemQueryFromLabel } from '../utils';
import { AlbumTreeItem } from './AlbumTreeItem';

export class BandTreeItem {
  static create(band: Band): TreeItem {
    const treeItem = TreeItemFactory.fromBand(band);
    const children: TreeItem[] = [];

    const artistsTreeItems =
      AlbumTreeItem.createTreeItemsFromAlbumsByArtistReleases(
        band.metadata.albums,
      );
    children.push({
      label: 'Artists',
      children: artistsTreeItems.map(setTreeItemQueryFromLabel),
    });

    children.push({
      label: 'Releases',
      children: AlbumTreeItem.createReleasesTreeItems(band.metadata.albums).map(
        setTreeItemQueryFromLabel,
      ),
    });

    treeItem.open = true;
    treeItem.href = undefined;
    treeItem.children = children;

    return treeItem;
  }

  static createBandYearsTreeItem(
    band: Band,
    label: string = 'Years',
  ): TreeItem {
    const children: TreeItem[] = band.metadata.years.reverse().map((year) => {
      const children: TreeItem[] = band.metadata
        .albumsByYear(year)
        .map(TreeItemFactory.fromAlbum)
        .map(setTreeItemQueryFromLabel);

      return {
        label: year.toString(),
        children,
      };
    });

    return {
      label,
      open: false,
      children,
    };
  }
}
