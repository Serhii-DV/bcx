import type { Band } from 'src/bandcamp/domain/band/band';
import type { TreeItem } from '../TreeItem';
import { TreeItemFactory } from '../TreeItemFactory';
import { setTreeItemQueryFromLabel } from '../utils';
import { AlbumTreeItem } from './AlbumTreeItem';

export class BandTreeItem {
  static create(band: Band): TreeItem {
    const treeItem = TreeItemFactory.fromBand(band);

    treeItem.open = true;
    treeItem.href = undefined;
    treeItem.children = [
      this.createReleasesTreeItem(band),
      this.createArtistsTreeItem(band),
    ];

    const yearsTreeItem = this.createBandYearsTreeItem(band);
    if (yearsTreeItem) {
      treeItem.children.push(yearsTreeItem);
    }

    treeItem.children.push(this.createBandInfo(band));

    return treeItem;
  }

  private static createArtistsTreeItem(band: Band): TreeItem {
    const children: TreeItem[] =
      AlbumTreeItem.createTreeItemsFromAlbumsByArtistReleases(
        band.metadata.albums,
      ).map(setTreeItemQueryFromLabel);

    return {
      label: 'Artists',
      children,
    };
  }

  private static createReleasesTreeItem(band: Band): TreeItem {
    const children: TreeItem[] = AlbumTreeItem.createAlbumsTreeItems(
      band.metadata.albums,
    ).map(setTreeItemQueryFromLabel);

    return {
      label: 'Releases',
      children,
    };
  }

  private static createBandYearsTreeItem(
    band: Band,
    label: string = 'Years',
  ): TreeItem | undefined {
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

    if (children.length === 0) {
      return undefined;
    }

    return {
      label,
      open: false,
      children,
    };
  }

  private static createBandInfo(band: Band): TreeItem {
    return {
      label: 'Information',
      children: [
        {
          label: `Created: ${band.metadata.created.toLocaleDateString()}`,
        },
        {
          label: `Currency: ${band.metadata.currency}`,
        },
      ],
    };
  }
}
