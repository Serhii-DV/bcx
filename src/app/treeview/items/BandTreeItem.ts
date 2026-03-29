import type { Band } from 'src/bandcamp/domain/band/band';
import { isBandcampMusicUrl } from 'src/bandcamp/domain/url/helper';
import type { Url } from 'src/core/url';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import type { TreeItem } from '../TreeItem';
import { TreeItemBuilder } from '../TreeItemBuilder';
import { TreeItemFactory } from '../TreeItemFactory';

export class BandTreeItem {
  static create(band: Band, url: Url): TreeItem {
    const isAlbumsWithActions = isBandcampMusicUrl(url);
    const treeItemBuilder = new TreeItemBuilder(TreeItemFactory.fromBand(band));
    treeItemBuilder.withOpen(isAlbumsWithActions).withoutHref();

    if (band.hasReleases) {
      treeItemBuilder.withChildren([
        this.createReleasesTreeItem(band, isAlbumsWithActions),
        this.createArtistsTreeItem(band, isAlbumsWithActions),
        this.createBandYearsTreeItem(band, isAlbumsWithActions),
        this.createBandInfo(band),
      ]);
    } else {
      treeItemBuilder.addChild(
        TreeItemFactory.createLink('Open Band/Label Page', band.url.toString()),
      );
    }

    return treeItemBuilder.build();
  }

  private static createArtistsTreeItem(
    band: Band,
    isAlbumsWithActions: boolean,
  ): TreeItem {
    return {
      label: 'Artists',
      children: AlbumTreeItemFactory.fromAlbumsByArtistReleases(
        band.metadata.albums,
        isAlbumsWithActions,
      ),
    };
  }

  private static createReleasesTreeItem(
    band: Band,
    isAlbumsWithActions: boolean,
  ): TreeItem {
    return {
      label: 'Releases',
      children: AlbumTreeItemFactory.fromAlbums(
        band.metadata.albums,
        isAlbumsWithActions,
      ),
    };
  }

  private static createBandYearsTreeItem(
    band: Band,
    isAlbumsWithActions: boolean,
    label: string = 'Years',
  ): TreeItem | undefined {
    const children: TreeItem[] = band.metadata.years.reverse().map((year) => {
      return {
        label: String(year),
        children: AlbumTreeItemFactory.fromAlbums(
          band.metadata.albumsByYear(year),
          isAlbumsWithActions,
        ),
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
