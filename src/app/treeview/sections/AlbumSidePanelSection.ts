import type { Album } from 'src/bandcamp/domain/album/album';
import { AlbumDetails } from 'src/bandcamp/domain/album/details';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import { TreeItemCache } from '../items/TreeItemCache';
import type { SidePanelSection } from '../SidePanelSection';
import { TREE_ITEM_LAYOUT } from '../TreeItem';
import { SIDE_PANEL_SECTION_CACHE_TTL } from './cacheTtl';
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
      label: album.title,
      image: AlbumTreeItemFactory.create(album).image,
      createTreeData: async () => {
        const albumTreeItem = await TreeItemCache.getOrCreate(
          TreeItemCache.subtreeKey('album', album.id),
          () =>
            AlbumTreeItemFactory.createWithDetails(
              albumDetails || AlbumDetails.fromAlbum(album),
            ),
          SIDE_PANEL_SECTION_CACHE_TTL.RELEASE,
        );

        return createTreeDataFromTreeItemChildren(
          albumTreeItem,
          TREE_ITEM_LAYOUT.TREE,
        );
      },
    };
  }
}
