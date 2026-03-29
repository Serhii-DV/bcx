import type { Album } from 'src/bandcamp/domain/album/album';
import { getArtistNamesFromAlbums } from 'src/bandcamp/domain/album/helper';
import { arrayUnique } from 'src/utils/array';
import type { TreeItem } from '../TreeItem';
import { TreeItemBuilder } from '../TreeItemBuilder';
import { TreeItemFactory } from '../TreeItemFactory';
import { setTreeItemQueryFromLabel } from '../utils';

export class AlbumTreeItemFactory {
  static create(album: Album, isWithActions: boolean = false): TreeItem {
    const builder = new TreeItemBuilder(TreeItemFactory.fromAlbum(album));

    if (isWithActions) {
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
    }

    return builder.build();
  }

  static createWithActions(album: Album): TreeItem {
    return this.create(album, true);
  }

  static fromAlbums(
    albums: Album[],
    isWithActions: boolean = false,
  ): TreeItem[] {
    return albums.map((album) => this.create(album, isWithActions));
  }

  static fromAlbumsByArtistReleases(
    albums: Album[],
    isWithActions: boolean = false,
  ): TreeItem[] {
    const artists = getArtistNamesFromAlbums(albums);
    return arrayUnique(artists)
      .sort()
      .map((artist) => {
        const children: TreeItem[] = this.fromAlbums(
          albums.filter((album) => album.containsArtistName(artist)),
          isWithActions,
        );

        return {
          label: artist,
          open: false,
          children,
        } as TreeItem;
      });
  }
}
