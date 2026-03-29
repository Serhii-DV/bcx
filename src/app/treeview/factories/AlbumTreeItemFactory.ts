import type { Album } from 'src/bandcamp/domain/album/album';
import type { TreeItem } from '../TreeItem';
import { TreeItemBuilder } from '../TreeItemBuilder';
import { TreeItemFactory } from '../TreeItemFactory';
import { setTreeItemQueryFromLabel } from '../utils';

export class AlbumTreeItemFactory {
  static createWithActionItems(album: Album): TreeItem {
    const builder = AlbumTreeItemFactory.createTreeItemBuilder(album);

    builder
      // Use current item and childrens for filtering
      .apply(setTreeItemQueryFromLabel)
      // Only this children is used as the link
      .addChild(
        TreeItemFactory.createLink('Open Release Page', album.url.toString()),
      );

    return builder.build();
  }

  private static createTreeItemBuilder(album: Album): TreeItemBuilder {
    const treeItemBuilder = new TreeItemBuilder(
      TreeItemFactory.fromAlbum(album),
    );

    if (album.artist.names.length) {
      treeItemBuilder.withChildren(
        album.artist.names.map(TreeItemFactory.fromArtistName),
      );
    }

    if (album.metadata) {
      treeItemBuilder.addChild({
        label: String(album.metadata.year),
      });
    }

    return treeItemBuilder;
  }
}
