import type { Album } from 'src/bandcamp/domain/album/album';
import {
  getArtistNamesFromAlbums,
  getReleaseMetadataFromAlbum,
} from 'src/bandcamp/domain/album/helper';
import { arrayUnique } from 'src/utils/array';
import { ArtistTreeItem } from '../items/ArtistTreeItem';
import type { TreeItem } from '../TreeItem';
import { TreeItemBuilder } from '../TreeItemBuilder';
import { TreeItemFactory } from '../TreeItemFactory';

export class AlbumTreeItemFactory {
  static create(album: Album): TreeItem {
    return this.createBuilder(album).build();
  }

  static createWithKeywords(album: Album): TreeItem {
    const builder = this.createBuilder(album);
    builder.apply((item) => {
      item.showChildrenCount = false;
    });
    const artistNames = album.artistNames.sort();
    const keywords = (album.metadata?.keywords || []).sort();

    builder.addChild(TreeItemFactory.textWithQuery(album.toString()));

    if (album.metadata?.year) {
      builder.addChild(
        TreeItemFactory.textWithQuery(String(album.metadata.year)),
      );
    }

    if (artistNames.length) {
      builder.addChild(
        TreeItemFactory.items(
          'Artists',
          artistNames.map(TreeItemFactory.textWithQuery),
        ),
      );
    }

    if (keywords.length) {
      builder.addChild(
        TreeItemFactory.items(
          'Tags',
          keywords.map(TreeItemFactory.textWithQuery),
        ),
      );
    }

    return builder.build();
  }

  static fromAlbums(
    albums: Album[],
    includeKeywords: boolean = false,
  ): TreeItem[] {
    return albums.map((album) =>
      includeKeywords ? this.createWithKeywords(album) : this.create(album),
    );
  }

  static fromAlbumsByArtistReleases(
    albums: Album[],
    includeKeywords: boolean = false,
  ): TreeItem[] {
    const artists = getArtistNamesFromAlbums(albums);
    return arrayUnique(artists)
      .sort()
      .map((artist) => {
        const artistChildren: TreeItem[] = this.fromAlbums(
          albums.filter((album) => album.containsArtistName(artist)),
          includeKeywords,
        );
        return TreeItemFactory.items(artist, artistChildren);
      });
  }

  static async createWithInformation(album: Album): Promise<TreeItem> {
    const builder = this.createBuilder(album);

    builder.withoutHref();
    builder.addChild(
      TreeItemFactory.text(`Released: ${album.metadata?.publishedDate}`),
    );

    const releaseMetadata = getReleaseMetadataFromAlbum(album);

    if (releaseMetadata.catalogNumber) {
      builder.addChild(
        TreeItemFactory.text(`Catalog: ${releaseMetadata.catalogNumber}`),
      );
    }

    if (releaseMetadata.releaseType) {
      builder.addChild(
        TreeItemFactory.text(`Type: ${releaseMetadata.releaseType}`),
      );
    }

    if (
      releaseMetadata.releaseYear &&
      releaseMetadata.releaseYear !== album.metadata?.year
    ) {
      builder.addChild(
        TreeItemFactory.text(`Year: ${releaseMetadata.releaseYear}`),
      );
    }

    if (releaseMetadata.artistNames?.length) {
      builder.addChild(
        TreeItemFactory.list('Parsed artists', releaseMetadata.artistNames),
      );
    }

    builder.addChild(
      TreeItemFactory.items(
        'Artists',
        await ArtistTreeItem.createTreeItems(album.artist),
      ),
    );
    builder.addChild(
      TreeItemFactory.items('Tracks', TreeItemFactory.fromTracks(album.tracks)),
    );
    builder.addChild(
      TreeItemFactory.list('Keywords', album.metadata?.keywords || []),
    );

    return builder.build();
  }

  private static createBuilder(album: Album): TreeItemBuilder {
    return new TreeItemBuilder(TreeItemFactory.fromAlbum(album));
  }
}
