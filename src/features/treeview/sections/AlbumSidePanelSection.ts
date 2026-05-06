import type { Album } from 'src/bandcamp/domain/album/album';
import { AlbumDetails } from 'src/bandcamp/domain/album/details';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import type { SidePanelSection } from '../SidePanelSection';
import { TREE_ITEM_LAYOUT } from '../TreeItem';
import { createTreeDataFromTreeItemChildren } from './treeDataFactory';

export class AlbumSidePanelSection {
  static create(
    album: Album | null,
    albumDetails: AlbumDetails | null,
  ): SidePanelSection | null {
    if (!album) {
      return null;
    }

    return {
      id: `album-${album.id}`,
      label: album.fullTitle,
      image: album.artwork.tinySizeUrl,
      createTreeData: async () => {
        const albumTreeItem = await AlbumTreeItemFactory.createWithDetails(
          albumDetails || AlbumDetails.fromAlbum(album),
        );

        return createTreeDataFromTreeItemChildren(
          albumTreeItem,
          TREE_ITEM_LAYOUT.TREE,
        );
      },
    };
  }
}
