import type { Album } from 'src/bandcamp/domain/album/album';
import { getArtistNamesFromAlbums } from 'src/bandcamp/domain/album/helper';
import { arrayUnique } from 'src/utils/array';
import type { TreeItem } from '../TreeItem';
import { TreeItemFactory } from '../TreeItemFactory';

export class AlbumTreeItem {
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
