import type { Album } from 'src/bandcamp/domain/album/album';
import {
  getArtistNamesFromAlbums,
  getReleaseMetadataFromAlbum,
} from 'src/bandcamp/domain/album/helper';
import { arrayUnique } from 'src/utils/array';
import { ArtistTreeItem } from '../items/ArtistTreeItem';
import type { TreeItem } from '../TreeItem';
import { items, list, TreeItemBuilder, text } from '../TreeItemBuilder';
import { TreeItemFactory } from '../TreeItemFactory';
import {
  ICON_BUILDING,
  ICON_CALENDAR_DAYS,
  ICON_LINK,
  ICON_LIST_MUSIC,
  ICON_MIC,
  ICON_TAGS,
} from '../utils/icon';

export class AlbumTreeItemFactory {
  static create(album: Album): TreeItem {
    const item = TreeItemFactory.linkOrText(
      album.toString(),
      album.url?.toString(),
    );
    item.image = album.artwork.tinySizeUrl;
    item.keywords = album.artistNames;
    return item;
  }

  static createWithBriefInformation(album: Album): TreeItem {
    const builder = this.builder(album).withoutLink().withoutChildrenCount();
    const artistNames = album.artistNames.sort();
    const keywords = (album.metadata?.keywords || []).sort();

    builder.add(TreeItemFactory.textWithQuery(album.toString()));

    if (album.metadata?.year) {
      builder.add(TreeItemFactory.textWithQuery(String(album.metadata.year)));
    }

    if (artistNames.length) {
      builder.add(
        TreeItemBuilder.items(
          'Artists',
          artistNames.map(TreeItemFactory.textWithQuery),
        )
          .withImage(ICON_MIC)
          .build(),
      );
    }

    if (keywords.length) {
      builder.add(
        TreeItemFactory.items(
          'Tags',
          keywords.map(TreeItemFactory.textWithQuery),
        ),
      );
    }

    builder.add(
      TreeItemFactory.link(
        'Open Album Page',
        album.url.toString(),
        undefined,
        false,
      ),
    );

    return builder.build();
  }

  static fromAlbums(
    albums: Album[],
    includeBriefInformation: boolean = false,
  ): TreeItem[] {
    return albums.map((album) =>
      includeBriefInformation
        ? this.createWithBriefInformation(album)
        : this.create(album),
    );
  }

  static fromAlbumsByArtistReleases(
    albums: Album[],
    includeBriefInformation: boolean = false,
  ): TreeItem[] {
    const artists = getArtistNamesFromAlbums(albums);
    return arrayUnique(artists)
      .sort()
      .map((artist) => {
        const artistChildren: TreeItem[] = this.fromAlbums(
          albums.filter((album) => album.containsArtistName(artist)),
          includeBriefInformation,
        );
        return TreeItemFactory.items(artist, artistChildren);
      });
  }

  static async createWithInformation(album: Album): Promise<TreeItem> {
    const builder = this.builder(album).withoutHref();
    const releaseMetadata = getReleaseMetadataFromAlbum(album);

    builder.add(
      items(
        `Artist: ${album.artist.toString()}`,
        await ArtistTreeItem.createTreeItems(album.artist),
      ).withImage(ICON_MIC),
    );

    if (releaseMetadata.artistNames?.length) {
      builder.add(list('Parsed artists', releaseMetadata.artistNames));
    }

    if (album.metadata) {
      builder.add(
        list(`Publisher: ${album.metadata.publisher}`, [
          album.metadata.publisher,
        ]).withImage(ICON_BUILDING),
      );
    }

    const year = releaseMetadata?.releaseYear || album.metadata?.year;

    if (year) {
      builder.add(
        items(
          `Year: ${year}`,
          album.metadata
            ? [
                text(
                  `Published Date: ${album.metadata.publishedDate}`,
                ).withImage(ICON_CALENDAR_DAYS),
                text(`Modified Date: ${album.metadata.modifiedDate}`).withImage(
                  ICON_CALENDAR_DAYS,
                ),
              ]
            : [],
        ).withImage(ICON_CALENDAR_DAYS),
      );
    }

    if (releaseMetadata.catalogNumber) {
      builder.add(
        TreeItemFactory.text(`Catalog: ${releaseMetadata.catalogNumber}`),
      );
    }

    if (releaseMetadata.releaseType) {
      builder.add(text(`Type: ${releaseMetadata.releaseType}`));
    }

    builder.add(
      items('Tracks', TreeItemFactory.fromTracks(album.tracks)).withImage(
        ICON_LIST_MUSIC,
      ),
    );

    builder.add(
      list('Tags', album.metadata?.keywords || []).withImage(ICON_TAGS),
    );

    builder.add(text(album.url.toString()).makeCopyable().withImage(ICON_LINK));

    return builder.build();
  }

  private static builder(album: Album): TreeItemBuilder {
    return TreeItemBuilder.create(this.create(album));
  }
}
