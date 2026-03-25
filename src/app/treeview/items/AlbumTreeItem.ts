import type { Album } from 'src/bandcamp/domain/album/album';
import { getArtistNamesFromAlbums } from 'src/bandcamp/domain/album/helper';
import { arrayUnique } from 'src/utils/array';
import type { TreeItem } from '../TreeItem';
import { TreeItemFactory } from '../TreeItemFactory';
import { ArtistTreeItem } from './ArtistTreeItem';

export class AlbumTreeItem {
  static async create(album: Album): Promise<TreeItem> {
    const children: TreeItem[] = [];

    children.push({
      label: `Released: ${album.metadata?.publishedDate}`,
    });
    children.push({
      label: 'Artists',
      children: await ArtistTreeItem.createTreeItems(album.artist),
    });
    children.push({
      label: 'Tracks',
      children: TreeItemFactory.fromTracks(album.tracks),
    });
    children.push(TreeItemFactory.fromKeywords(album.metadata?.keywords || []));

    const treeItem = TreeItemFactory.fromAlbum(album);
    treeItem.href = undefined;
    treeItem.children = children;

    return treeItem;
  }

  static createTreeItemsFromAlbumsByArtistReleases(
    albums: Album[],
  ): TreeItem[] {
    const artists = getArtistNamesFromAlbums(albums);
    return arrayUnique(artists)
      .sort()
      .map((artist) => {
        const children: TreeItem[] = albums
          .filter((album) => album.containsArtistName(artist))
          .map(TreeItemFactory.fromAlbum);

        return {
          label: artist,
          open: false,
          children,
        } as TreeItem;
      });
  }

  static createReleasesTreeItems(albums: Album[]): TreeItem[] {
    return albums.map(TreeItemFactory.fromAlbum);
  }

  static createTreeItemsAlbumsByArtistNames(albums: Album[]): TreeItem[] {
    const artistNames = getArtistNamesFromAlbums(albums);
    const children = arrayUnique(artistNames)
      .sort()
      .map((artist) => {
        const artistChildren: TreeItem[] = albums
          .filter((album) => album.artist.names.includes(artist))
          .map(TreeItemFactory.fromAlbum);

        return {
          label: artist,
          open: false,
          children: artistChildren,
        } as TreeItem;
      });

    return children;
  }
}
