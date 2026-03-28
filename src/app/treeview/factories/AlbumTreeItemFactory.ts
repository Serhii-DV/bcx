import type { Album } from 'src/bandcamp/domain/album/album';
import type { TreeItem } from '../TreeItem';
import { TreeItemFactory } from '../TreeItemFactory';
import { setTreeItemQueryFromLabel } from '../utils';

export class AlbumTreeItemFactory {
  static createWithChildren(album: Album): TreeItem {
    const item = TreeItemFactory.fromAlbum(album);
    item.children = album.artist.names.map(TreeItemFactory.fromArtistName);

    if (album.metadata) {
      item.children.push({
        label: album.metadata.year.toString(),
      });
    }

    // Use current item and childres for filtering
    setTreeItemQueryFromLabel(item);

    // Only this children is used as the link
    item.children.push(
      TreeItemFactory.createLink('Open Bandcamp Page', album.url.toString()),
    );

    return item;
  }
}
