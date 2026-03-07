import type { Album } from 'src/bandcamp/domain/album/album';
import type { Track } from 'src/bandcamp/domain/track/track';
import type { TreeItem } from '../TreeItem';
import { TreeItemFactory } from '../TreeItemFactory';

export class AlbumTreeItem {
  static create(album: Album): TreeItem {
    const children: TreeItem[] = [];

    children.push({
      label: `Released: ${album.metadata?.publishedDate}`,
    });
    children.push(createTracksTreeItem(album.tracks));
    children.push(TreeItemFactory.fromKeywords(album.metadata?.keywords || []));

    const treeItem = TreeItemFactory.fromAlbum(album);
    treeItem.href = undefined;
    treeItem.children = children;

    return treeItem;
  }
}


function createTracksTreeItem(
  tracks: Track[],
  label: string = 'Tracks',
): TreeItem {
  const children: TreeItem[] = tracks.map((track) => ({
    label: track.toAlbumTrackString(),
    href: track.url?.toString(),
  }));

  return {
    label,
    children,
  };
}
