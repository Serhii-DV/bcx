import type { Album } from 'src/bandcamp/domain/album/album';
import { getArtistNamesFromAlbums } from 'src/bandcamp/domain/album/helper';
import { arrayUnique } from 'src/utils/array';
import { ArtistTreeItem } from '../items/ArtistTreeItem';
import type { TreeItem } from '../TreeItem';
import { TreeItemBuilder } from '../TreeItemBuilder';
import { TreeItemFactory } from '../TreeItemFactory';
import { setTreeItemQueryFromLabel } from '../utils';

export class AlbumTreeItemFactory {
  static create(album: Album): TreeItem {
    return this.createBuilder(album).build();
  }

  static createWithActions(album: Album): TreeItem {
    const builder = this.createBuilder(album);

    if (album.artist.names.length) {
      builder.withChildren(
        album.artist.names.map(TreeItemFactory.fromArtistName),
      );
    }

    if (album.metadata) {
      builder.addChild({
        label: String(album.metadata.year),
      });
    }

    builder
      // Use current item and childrens for filtering
      .apply(setTreeItemQueryFromLabel)
      // Only this children is used as the link
      .addChild(
        TreeItemFactory.createLink('Open Release Page', album.url.toString()),
      );

    return builder.build();
  }

  static fromAlbums(
    albums: Album[],
    isWithActions: boolean = false,
  ): TreeItem[] {
    return albums.map((album) =>
      isWithActions ? this.createWithActions(album) : this.create(album),
    );
  }

  static fromAlbumsByArtistReleases(
    albums: Album[],
    isWithActions: boolean = false,
  ): TreeItem[] {
    const artists = getArtistNamesFromAlbums(albums);
    return arrayUnique(artists)
      .sort()
      .map((artist) => {
        const artistChildren: TreeItem[] = this.fromAlbums(
          albums.filter((album) => album.containsArtistName(artist)),
          isWithActions,
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
