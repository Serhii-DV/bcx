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

    builder.addChild(
      TreeItemFactory.link('Open Album Page', album.url.toString()),
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
    const builder = this.builder(album);

    builder.withoutHref();

    if (album.metadata) {
      builder.addChild(
        TreeItemFactory.list('Publisher', [album.metadata.publisher]),
      );
      builder.addChild(
        TreeItemBuilder.create(
          TreeItemFactory.items('Date', [
            TreeItemFactory.list('Published', [album.metadata.publishedDate]),
            TreeItemFactory.list('Modified', [album.metadata.modifiedDate]),
          ]),
        )
          .withoutChildrenCount()
          .withoutChildrenCountAllChildren()
          .build(),
      );
    }

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
      TreeItemFactory.list('Tags', album.metadata?.keywords || []),
    );

    return builder.build();
  }

  private static builder(album: Album): TreeItemBuilder {
    return TreeItemBuilder.create(this.create(album));
  }
}
