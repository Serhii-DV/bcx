import type { Band } from 'src/bandcamp/domain/band/band';
import type { TreeItem } from '../TreeItem';
import { TreeItemFactory } from '../TreeItemFactory';

export class BandTreeItem {
  static create(band: Band): TreeItem {
    const treeItem = TreeItemFactory.fromBand(band);
    const children: TreeItem[] = TreeItemFactory.createTreeItemsFromAlbumsByArtistReleases(band.metadata.albums);

    treeItem.href = undefined;
    treeItem.children = children;

    return treeItem;
  }
}
