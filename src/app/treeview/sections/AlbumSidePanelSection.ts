import { AlbumDetails } from 'src/bandcamp/domain/album/details';
import { AlbumTreeItemFactory } from '../factories/AlbumTreeItemFactory';
import { TreeItemCache } from '../items/TreeItemCache';
import { SIDE_PANEL_SECTION_CACHE_TTL } from './cacheTtl';
import { createTreeDataFromTreeItemChildren } from './treeDataFactory';
import type {
  PendingSidePanelSection,
  SidePanelSectionsContext,
} from './types';

export class AlbumSidePanelSection {
  static create({
    album,
    albumDetails,
  }: SidePanelSectionsContext): PendingSidePanelSection | null {
    if (!album) {
      return null;
    }

    return {
      label: album.title,
      image: AlbumTreeItemFactory.create(album).image,
      createTreeData: async () => {
        const albumTreeItem = await TreeItemCache.getOrCreate(
          TreeItemCache.subtreeKey('release', album.id),
          () =>
            AlbumTreeItemFactory.createWithDetails(
              albumDetails || AlbumDetails.fromAlbum(album),
            ),
          SIDE_PANEL_SECTION_CACHE_TTL.RELEASE,
        );

        return createTreeDataFromTreeItemChildren(albumTreeItem);
      },
    };
  }
}
