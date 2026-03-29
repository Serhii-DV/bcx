import type { Band } from 'src/bandcamp/domain/band/band';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import type { TreeItem } from '../TreeItem';
import { TreeItemBuilder } from '../TreeItemBuilder';
import { TreeItemFactory } from '../TreeItemFactory';

export class BandTreeItem {
  static createForMusicPage(band: Band): TreeItem {
    const treeItemBuilder = new TreeItemBuilder(TreeItemFactory.fromBand(band));
    treeItemBuilder.withOpen(true).withoutHref();

    if (band.hasReleases) {
      const releasesTreeItem = this.createReleasesTreeItem(band);
      const artistsTreeItem = this.createArtistsTreeItem(band);
      const children = [releasesTreeItem, artistsTreeItem];

      const yearsTreeItem = this.createBandYearsTreeItem(band);
      if (yearsTreeItem) {
        children.push(yearsTreeItem);
      }

      children.push(this.createBandInfo(band));

      treeItemBuilder.withChildren(children);
    } else {
      treeItemBuilder.withChildren([
        TreeItemFactory.createLink('Open Bandcamp Page', band.url.toString()),
      ]);
    }

    return treeItemBuilder.build();
  }

  static createForAlbumPage(band: Band): TreeItem {
    const treeItemBuilder = new TreeItemBuilder(TreeItemFactory.fromBand(band));

    if (band.hasReleases) {
      const releasesTreeItem = this.createReleasesTreeItem(band);
      const artistsTreeItem = this.createArtistsTreeItem(band);

      const children = [releasesTreeItem, artistsTreeItem];

      const yearsTreeItem = this.createBandYearsTreeItem(band);
      if (yearsTreeItem) {
        children.push(yearsTreeItem);
      }

      treeItemBuilder.withChildren(children);
    } else {
      treeItemBuilder.withChildren([
        TreeItemFactory.createLink('Open Bandcamp Page', band.url.toString()),
      ]);
    }

    return treeItemBuilder.build();
  }

  private static createArtistsTreeItem(band: Band): TreeItem {
    return {
      label: 'Artists',
      children: AlbumTreeItemFactory.fromAlbumsByArtistReleases(
        band.metadata.albums,
      ),
    };
  }

  private static createReleasesTreeItem(band: Band): TreeItem {
    return {
      label: 'Releases',
      children: band.metadata.albums.map(
        AlbumTreeItemFactory.createWithActionItems,
      ),
    };
  }

  private static createBandYearsTreeItem(
    band: Band,
    label: string = 'Years',
  ): TreeItem | undefined {
    const children: TreeItem[] = band.metadata.years.reverse().map((year) => {
      const children: TreeItem[] = band.metadata
        .albumsByYear(year)
        .map(AlbumTreeItemFactory.createWithActionItems);

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
