import type { Album } from 'src/bandcamp/domain/album/album';
import type { AlbumDetails } from 'src/bandcamp/domain/album/details';
import { getArtistNamesFromAlbums } from 'src/bandcamp/domain/album/helper';
import { arrayUnique } from 'src/utils/array';
import { ArtistTreeItem } from '../items/ArtistTreeItem';
import type { TreeItem } from '../TreeItem';
import { items, link, list, TreeItemBuilder, text } from '../TreeItemBuilder';
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

  static createWithSummary(album: Album): TreeItem {
    const builder = this.builder(album).withoutLink().withoutChildrenCount();
    const artistNames = [...album.artistNames].sort();
    const keywords = [...(album.metadata?.keywords || [])].sort();

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

    builder.add(link('Open Album Page', album.url.toString()));

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
        return TreeItemFactory.items(artist, artistChildren);
      });
  }

  static async createWithDetails(details: AlbumDetails): Promise<TreeItem> {
    const builder = this.detailsBuilder(details).withoutHref();
    const artistItems = await ArtistTreeItem.createTreeItems(details.artist);

    builder.add(items(`${details.artist}`, artistItems).withImage(ICON_MIC));

    if (details.releaseMetadata.artistNames?.length) {
      builder.add(list('Parsed artists', details.releaseMetadata.artistNames));
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
      builder.add(
        TreeItemFactory.text(
          `Catalog: ${details.releaseMetadata.catalogNumber}`,
        ),
      );
    }

    if (details.releaseMetadata.releaseType) {
      builder.add(text(`Type: ${details.releaseMetadata.releaseType}`));
    }

    builder.add(
      items('Tracks', TreeItemFactory.fromTracks(details.tracks)).withImage(
        ICON_LIST_MUSIC,
      ),
    );

    builder.add(list('Tags', details.tags).withImage(ICON_TAGS));

    builder.add(text(details.url).makeCopyable().withImage(ICON_LINK));

    return builder.build();
  }

  private static builder(album: Album): TreeItemBuilder {
    return TreeItemBuilder.create(this.create(album));
  }

  private static detailsBuilder(details: AlbumDetails): TreeItemBuilder {
    const item = TreeItemFactory.linkOrText(details.displayTitle, details.url);
    item.image = details.artwork.tinySizeUrl;
    item.keywords = details.artist.names;

    return TreeItemBuilder.create(item);
  }
}
