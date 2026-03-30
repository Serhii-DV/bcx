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

  static createWithKeywords(album: Album): TreeItem {
    const builder = this.createBuilder(album);
    const artistNames = album.artistNames.sort();

    if (artistNames.length) {
      builder.addChildren(artistNames.map(TreeItemFactory.fromArtistName));
    }

    if (album.metadata) {
      builder.addChild(TreeItemFactory.text(String(album.metadata.year)));

      builder.addChildren(
        (album.metadata.keywords || []).map(TreeItemFactory.text),
      );
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
