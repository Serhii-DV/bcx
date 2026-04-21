import type { Album } from 'src/bandcamp/domain/album/album';
import type { Band } from 'src/bandcamp/domain/band/band';
import { isBandcampMusicUrl } from 'src/bandcamp/domain/url/helper';
import type { Url } from 'src/core/url';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import { BandTreeItemFactory } from '../factories/BandTreeItemFactory';
import type { TreeItem } from '../TreeItem';
import { items, link, list, TreeItemBuilder } from '../TreeItemBuilder';
import {
  ICON_BANKNOTE,
  ICON_CALENDAR,
  ICON_CALENDAR_DAYS,
  ICON_INFO,
} from '../utils/icon';
import { createPagedReleasesTreeItem } from './pagedReleasesTreeItem';

export class BandTreeItem {
  static create(band: Band, url: Url): TreeItem {
    const showAlbumsWithSummary = isBandcampMusicUrl(url);
    const builder = new TreeItemBuilder(BandTreeItemFactory.create(band));
    builder.withOpen(showAlbumsWithSummary).withoutHref();

    if (band.hasReleases) {
      builder.withChildren([
        AlbumTreeItemFactory.createArtistsTreeItem(
          band.metadata.albums,
          showAlbumsWithSummary,
        ),
        this.createReleasesTreeItem(
          band.metadata.albums,
          showAlbumsWithSummary,
        ),
        this.createBandYearsTreeItem(band, showAlbumsWithSummary),
        this.createBandAbout(band),
      ]);
    } else {
      builder.add(link('Open Band/Label Page', band.url.toString()));
    }

    return builder.build();
  }

  private static createReleasesTreeItem(
    albums: Album[],
    withAlbumSummary: boolean,
  ): TreeItem {
    return createPagedReleasesTreeItem({
      albums,
      errorContext: '[BandTreeItem.createLoadMoreReleasesTreeItem]',
      withAlbumSummary,
    });
  }

  private static createBandYearsTreeItem(
    band: Band,
    withAlbumSummary: boolean,
    label: string = 'Years',
  ): TreeItem | undefined {
    const metadata = band.metadata;
    const children: TreeItem[] = metadata.years.reverse().map((year) => {
      return {
        label: String(year),
        children: AlbumTreeItemFactory.fromAlbums(
          metadata.albumsByYear(year),
          withAlbumSummary,
        ),
      };
    });

    if (children.length === 0) {
      return undefined;
    }

    return items(label, children)
      .withImage(ICON_CALENDAR)
      .withChildrenImage(ICON_CALENDAR_DAYS)
      .build();
  }

  private static createBandAbout(band: Band): TreeItem {
    return items('About ' + band.name, [
      list('Created', [band.metadata.created.toLocaleDateString()]).withImage(
        ICON_CALENDAR_DAYS,
      ),
      list('Currency', [band.metadata.currency]).withImage(ICON_BANKNOTE),
    ])
      .asTree()
      .withImage(ICON_INFO)
      .build();
  }
}
