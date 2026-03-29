import type { Album } from 'src/bandcamp/domain/album/album';
import { TreeItemBuilder } from '../TreeItemBuilder';
import { TreeItemFactory } from '../TreeItemFactory';

export class AlbumTreeItemBuilder {
  static create(album: Album): TreeItemBuilder {
    const treeItemBuilder = new TreeItemBuilder(
      TreeItemFactory.fromAlbum(album),
    );

    treeItemBuilder.withChildren(
      album.artist.names.map(TreeItemFactory.fromArtistName),
    );

    if (album.metadata) {
      treeItemBuilder.addChild({
        label: album.metadata.year.toString(),
      });
    }

    return treeItemBuilder;
  }
}
