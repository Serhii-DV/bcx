import type { Band } from 'src/bandcamp/domain/band/band';
import { isBandcampMusicUrl } from 'src/bandcamp/domain/url/helper';
import type { Url } from 'src/core/url';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import type { TreeItem } from '../TreeItem';
import { TreeItemBuilder } from '../TreeItemBuilder';
import { TreeItemFactory } from '../TreeItemFactory';

export class BandTreeItem {
  static create(band: Band, url: Url): TreeItem {
    const showAlbumsWithKeywords = isBandcampMusicUrl(url);
    const treeItemBuilder = new TreeItemBuilder(TreeItemFactory.fromBand(band));
    treeItemBuilder.withOpen(showAlbumsWithKeywords).withoutHref();

    if (band.hasReleases) {
      treeItemBuilder.withChildren([
        this.createArtistsTreeItem(band, showAlbumsWithKeywords),
        this.createReleasesTreeItem(band, showAlbumsWithKeywords),
        this.createBandYearsTreeItem(band, showAlbumsWithKeywords),
        this.createBandAbout(band),
      ]);
    } else {
      treeItemBuilder.addChild(
        TreeItemFactory.link('Open Band/Label Page', band.url.toString()),
      );
    }

    return treeItemBuilder.build();
  }

  private static createArtistsTreeItem(
    band: Band,
    showAlbumsWithKeywords: boolean,
  ): TreeItem {
    return {
      label: 'Artists',
      children: AlbumTreeItemFactory.fromAlbumsByArtistReleases(
        band.metadata.albums,
        showAlbumsWithKeywords,
      ),
    };
  }

  private static createReleasesTreeItem(
    band: Band,
    showAlbumsWithKeywords: boolean,
  ): TreeItem {
    return {
      label: 'Releases',
      children: AlbumTreeItemFactory.fromAlbums(
        band.metadata.albums,
        showAlbumsWithKeywords,
      ),
    };
  }

  private static createBandYearsTreeItem(
    band: Band,
    showAlbumsWithKeywords: boolean,
    label: string = 'Years',
  ): TreeItem | undefined {
    const children: TreeItem[] = band.metadata.years.reverse().map((year) => {
      return {
        label: String(year),
        children: AlbumTreeItemFactory.fromAlbums(
          band.metadata.albumsByYear(year),
          showAlbumsWithKeywords,
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

  private static createBandAbout(band: Band): TreeItem {
    return {
      label: 'About',
      children: [
        TreeItemFactory.text(
          `Created: ${band.metadata.created.toLocaleDateString()}`,
        ),
        TreeItemFactory.text(`Currency: ${band.metadata.currency}`),
      ],
    };
  }
}
