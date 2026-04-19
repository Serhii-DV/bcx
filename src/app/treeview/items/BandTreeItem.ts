import type { Band } from 'src/bandcamp/domain/band/band';
import { isBandcampMusicUrl } from 'src/bandcamp/domain/url/helper';
import type { Url } from 'src/core/url';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import type { TreeItem } from '../TreeItem';
import { link, TreeItemBuilder } from '../TreeItemBuilder';
import { TreeItemFactory } from '../TreeItemFactory';
import { ICON_CALENDAR, ICON_DISC, ICON_INFO, ICON_MIC } from '../utils/icon';

export class BandTreeItem {
  static create(band: Band, url: Url): TreeItem {
    const showAlbumsWithKeywords = isBandcampMusicUrl(url);
    const builder = new TreeItemBuilder(TreeItemFactory.fromBand(band));
    builder.withOpen(showAlbumsWithKeywords).withoutHref();

    if (band.hasReleases) {
      builder.withChildren([
        this.createArtistsTreeItem(band, showAlbumsWithKeywords),
        this.createReleasesTreeItem(band, showAlbumsWithKeywords),
        this.createBandYearsTreeItem(band, showAlbumsWithKeywords),
        this.createBandAbout(band),
      ]);
    } else {
      builder.add(link('Open Band/Label Page', band.url.toString()));
    }

    return builder.build();
  }

  private static createArtistsTreeItem(
    band: Band,
    includeBriefInformation: boolean,
  ): TreeItem {
    return TreeItemBuilder.items(
      'Artists',
      AlbumTreeItemFactory.fromAlbumsByArtistReleases(
        band.metadata.albums,
        includeBriefInformation,
      ),
    )
      .withImage(ICON_MIC)
      .build();
  }

  private static createReleasesTreeItem(
    band: Band,
    includeBriefInformation: boolean,
  ): TreeItem {
    return TreeItemBuilder.items(
      'Releases',
      AlbumTreeItemFactory.fromAlbums(
        band.metadata.albums,
        includeBriefInformation,
      ),
    )
      .withImage(ICON_DISC)
      .build();
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

    return TreeItemBuilder.items(label, children)
      .withImage(ICON_CALENDAR)
      .build();
  }

  private static createBandAbout(band: Band): TreeItem {
    return TreeItemBuilder.items('About ' + band.name, [
      TreeItemFactory.list('Created', [
        band.metadata.created.toLocaleDateString(),
      ]),
      TreeItemFactory.list('Currency', [band.metadata.currency]),
    ])
      .withImage(ICON_INFO)
      .build();
  }
}
