import type { Album } from 'src/bandcamp/domain/album/album';
import { AlbumTreeItemBuilder } from '../builders/AlbumTreeItemBuilder';
import type { TreeItem } from '../TreeItem';
import { TreeItemFactory } from '../TreeItemFactory';
import { setTreeItemQueryFromLabel } from '../utils';

export class AlbumTreeItemFactory {
  static createWithChildren(album: Album): TreeItem {
    const builder = AlbumTreeItemBuilder.create(album);

    builder
      // Use current item and childres for filtering
      .apply(setTreeItemQueryFromLabel)
      // Only this children is used as the link
      .addChild(
        TreeItemFactory.createLink('Open Bandcamp Page', album.url.toString()),
      );

    return builder.build();
  }
}
