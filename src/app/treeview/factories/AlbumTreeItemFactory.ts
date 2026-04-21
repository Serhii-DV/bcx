import type { Album } from 'src/bandcamp/domain/album/album';
import type { AlbumDetails } from 'src/bandcamp/domain/album/details';
import { getArtistNamesFromAlbums } from 'src/bandcamp/domain/album/helper';
import { arrayUnique } from 'src/utils/array';
import { ArtistTreeItem } from '../items/ArtistTreeItem';
import { type TreeItem } from '../TreeItem';
import {
  builder,
  items,
  link,
  linkOrText,
  list,
  searchQuery,
  TreeItemBuilder,
  text,
} from '../TreeItemBuilder';
import {
  ICON_BUILDING,
  ICON_CALENDAR_DAYS,
  ICON_LINK,
  ICON_LIST_MUSIC,
  ICON_MIC,
  ICON_TAG,
  ICON_TAGS,
} from '../utils/icon';
import { TrackTreeItemFactory } from './TrackTreeItemFactory';

export class AlbumTreeItemFactory {
  static create(album: Album): TreeItem {
    return linkOrText(album.toString(), album.url?.toString())
      .withImage(album.artwork.tinySizeUrl)
      .withKeywords(album.artistNames)
      .build();
  }

  static createWithSummary(album: Album): TreeItem {
    const builder = this.builder(album)
      .withoutLink()
      .withoutChildrenCount()
      .asTree();
    const artistNames = [...album.artistNames].sort();
    const keywords = [...(album.metadata?.keywords || [])].sort();

    builder.add(searchQuery(album.toString()));

    if (artistNames.length) {
      builder.add(
        items(
          'Artists',
          artistNames.map((artistName) => searchQuery(artistName)),
        )
          .withImage(ICON_MIC)
          .build(),
      );
    }

    if (album.metadata) {
      builder.add(
        searchQuery(String(album.metadata.year)).withImage(ICON_CALENDAR_DAYS),
      );
    }

    if (keywords.length) {
      builder.add(
        items(
          'Tags',
          keywords.map((keyword) => searchQuery(keyword).withImage(ICON_TAG)),
        )
          .withImage(ICON_TAGS)
          .build(),
      );
    }

    builder.add(link(album.url.toString(), album.url.toString()));

    return builder.build();
  }

  static fromAlbums(albums: Album[], withSummary: boolean = false): TreeItem[] {
    return albums.map((album) =>
      withSummary ? this.createWithSummary(album) : this.create(album),
    );
  }

  static fromAlbumsByArtistReleases(
    albums: Album[],
    withSummary: boolean = false,
  ): TreeItem[] {
    const artists = getArtistNamesFromAlbums(albums);
    return arrayUnique(artists)
      .sort()
      .map((artist) => {
        const artistChildren: TreeItem[] = this.fromAlbums(
          albums.filter((album) => album.containsArtistName(artist)),
          withSummary,
        );
        return items(artist, artistChildren).build();
      });
  }

  static async createWithDetails(details: AlbumDetails): Promise<TreeItem> {
    const builder = this.detailsBuilder(details).withoutHref().asTree();
    const artistItems = await ArtistTreeItem.createTreeItems(details.artist);

    builder.add(text(details.displayTitle).makeCopyable());
    builder.add(items(`${details.artist}`, artistItems).withImage(ICON_MIC));

    if (details.releaseMetadata.artistNames?.length) {
      builder.add(
        list('Parsed artists', details.releaseMetadata.artistNames).withImage(
          ICON_MIC,
        ),
      );
    }

    builder.add(
      items(`Publisher: ${details.publisher}`, [
        text(details.publisher).makeCopyable(),
      ]).withImage(ICON_BUILDING),
    );

    const year = details.year;

    if (year) {
      builder.add(
        items(`${year}`, [
          text(`Published Date: ${details.publishedDate}`).withImage(
            ICON_CALENDAR_DAYS,
          ),
          text(`Modified Date: ${details.modifiedDate}`).withImage(
            ICON_CALENDAR_DAYS,
          ),
        ]).withImage(ICON_CALENDAR_DAYS),
      );
    }

    if (details.releaseMetadata.catalogNumber) {
      builder.add(text(`Catalog: ${details.releaseMetadata.catalogNumber}`));
    }

    if (details.releaseMetadata.releaseType) {
      builder.add(text(`Type: ${details.releaseMetadata.releaseType}`));
    }

    builder.add(
      items(
        'Tracks',
        TrackTreeItemFactory.createMany(details.tracks),
      ).withImage(ICON_LIST_MUSIC),
    );

    builder.add(
      list('Tags', details.tags)
        .withImage(ICON_TAGS)
        .withChildrenImage(ICON_TAG),
    );

    builder.add(text(details.url).makeCopyable().withImage(ICON_LINK));

    return builder.build();
  }

  private static builder(album: Album): TreeItemBuilder {
    return builder(this.create(album));
  }

  private static detailsBuilder(details: AlbumDetails): TreeItemBuilder {
    return linkOrText(details.displayTitle, details.url)
      .withImage(details.artwork.tinySizeUrl)
      .withKeywords(details.artist.names);
  }
}
