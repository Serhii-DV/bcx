import type { Album } from 'src/bandcamp/domain/album/album';
import type { TreeItem } from '../TreeItem';
import { TreeItemFactory } from '../TreeItemFactory';

export class AlbumTreeItem {
  static create(album: Album): TreeItem {
    const children: TreeItem[] = [];

    children.push({
      label: `Released: ${album.metadata?.publishedDate}`,
    });
    children.push({
      label: 'Artists',
      children: TreeItemFactory.fromArtist(album.artist),
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
}
