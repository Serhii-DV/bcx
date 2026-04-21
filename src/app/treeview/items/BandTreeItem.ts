import type { Band } from 'src/bandcamp/domain/band/band';
import { isBandcampMusicUrl } from 'src/bandcamp/domain/url/helper';
import type { Url } from 'src/core/url';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import { BandTreeItemFactory } from '../factories/BandTreeItemFactory';
import type { TreeItem } from '../TreeItem';
import { items, link, list, TreeItemBuilder } from '../TreeItemBuilder';
import { ICON_CALENDAR, ICON_DISC, ICON_INFO, ICON_MIC } from '../utils/icon';

export class BandTreeItem {
  static create(band: Band, url: Url): TreeItem {
    const showAlbumsWithKeywords = isBandcampMusicUrl(url);
    const builder = new TreeItemBuilder(BandTreeItemFactory.create(band));
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
    withAlbumSummary: boolean,
  ): TreeItem {
    return items(
      'Artists',
      AlbumTreeItemFactory.fromAlbumsByArtistReleases(
        band.metadata.albums,
        withAlbumSummary,
      ),
    )
      .withImage(ICON_MIC)
      .build();
  }

  private static createReleasesTreeItem(
    band: Band,
    withAlbumSummary: boolean,
  ): TreeItem {
    return items(
      'Releases',
      AlbumTreeItemFactory.fromAlbums(band.metadata.albums, withAlbumSummary),
    )
      .withImage(ICON_DISC)
      .build();
  }

  private static createBandYearsTreeItem(
    band: Band,
    withAlbumSummary: boolean,
    label: string = 'Years',
  ): TreeItem | undefined {
    const children: TreeItem[] = band.metadata.years.reverse().map((year) => {
      return {
        label: String(year),
        children: AlbumTreeItemFactory.fromAlbums(
          band.metadata.albumsByYear(year),
          withAlbumSummary,
        ),
      };
    });

    if (children.length === 0) {
      return undefined;
    }

    return items(label, children).withImage(ICON_CALENDAR).build();
  }

  private static createBandAbout(band: Band): TreeItem {
    return items('About ' + band.name, [
      list('Created', [band.metadata.created.toLocaleDateString()]),
      list('Currency', [band.metadata.currency]),
    ])
      .withImage(ICON_INFO)
      .build();
  }
}
