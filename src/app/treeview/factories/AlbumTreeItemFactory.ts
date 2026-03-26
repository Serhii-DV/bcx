import type { Album } from 'src/bandcamp/domain/album/album';
import type { TreeItem } from '../TreeItem';
import { TreeItemFactory } from '../TreeItemFactory';

export class AlbumTreeItemFactory {
  static createWithChildren(album: Album): TreeItem {
    const item = TreeItemFactory.fromAlbum(album);
    item.children = album.artist.names.map(TreeItemFactory.fromArtistName);

    if (album.metadata) {
      item.children.push({
        label: album.metadata.year.toString(),
      });
    }

    return item;
  }
}
