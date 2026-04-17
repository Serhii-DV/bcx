import type { Band } from 'src/bandcamp/domain/band/band';
import { isBandcampMusicUrl } from 'src/bandcamp/domain/url/helper';
import type { Url } from 'src/core/url';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import type { TreeItem } from '../TreeItem';
import { TreeItemBuilder } from '../TreeItemBuilder';
import { TreeItemFactory } from '../TreeItemFactory';
import { ICON_CALENDAR, ICON_DISC, ICON_INFO, ICON_MIC } from '../utils/icon';

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
        TreeItemFactory.link(
          'Open Band/Label Page',
          band.url.toString(),
          undefined,
          false,
        ),
      );
    }

    return treeItemBuilder.build();
  }

  private static createArtistsTreeItem(
    band: Band,
    includeBriefInformation: boolean,
  ): TreeItem {
    return {
      label: 'Artists',
      image: ICON_MIC,
      children: AlbumTreeItemFactory.fromAlbumsByArtistReleases(
        band.metadata.albums,
        includeBriefInformation,
      ),
    };
  }

  private static createReleasesTreeItem(
    band: Band,
    includeBriefInformation: boolean,
  ): TreeItem {
    return {
      label: 'Releases',
      image: ICON_DISC,
      children: AlbumTreeItemFactory.fromAlbums(
        band.metadata.albums,
        includeBriefInformation,
      ),
    };
  }

  private static createBandYearsTreeItem(
    band: Band,
    includeBriefInformation: boolean,
    label: string = 'Years',
  ): TreeItem | undefined {
    const children: TreeItem[] = band.metadata.years.reverse().map((year) => {
      return {
        label: String(year),
        children: AlbumTreeItemFactory.fromAlbums(
          band.metadata.albumsByYear(year),
          includeBriefInformation,
        ),
      };
    });

    if (children.length === 0) {
      return undefined;
    }

    return {
      label,
      image: ICON_CALENDAR,
      open: false,
      children,
    };
  }

  private static createBandAbout(band: Band): TreeItem {
    return {
      label: 'About ' + band.name,
      image: ICON_INFO,
      children: [
        TreeItemFactory.list('Created', [
          band.metadata.created.toLocaleDateString(),
        ]),
        TreeItemFactory.list('Currency', [band.metadata.currency]),
      ],
    };
  }
}
