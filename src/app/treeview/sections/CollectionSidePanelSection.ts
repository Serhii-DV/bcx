import { CollectionTreeItem } from '../items/collection/CollectionTreeItem';
import { TreeItemCache } from '../items/TreeItemCache';
import type { SidePanelSection } from '../SidePanelSection';
import { ICON_LIBRARY } from '../utils/icon';
import { SIDE_PANEL_SECTION_CACHE_TTL } from './cacheTtl';
import { createTreeDataFromTreeItemChildren } from './treeDataFactory';
import type { SidePanelSectionsContext } from './types';

export class CollectionSidePanelSection {
  static create({
    pageDataContext,
    userKeyPart,
  }: SidePanelSectionsContext): SidePanelSection | null {
    if (!pageDataContext) {
      return null;
    }

    const fanData = pageDataContext.fanData;
    const pageData = pageDataContext.data;

    return {
      id: `collection-${userKeyPart}`,
      label: 'Collection',
      image: ICON_LIBRARY,
      childrenCount:
        pageData?.collection_data?.item_count ??
        pageData?.current_fan?.collection_count ??
        pageData?.collection_count,
      createTreeData: async () =>
        createTreeDataFromTreeItemChildren(
          await TreeItemCache.getOrCreate(
            TreeItemCache.subtreeKey(userKeyPart, 'collection'),
            () => CollectionTreeItem.create(fanData.username || ''),
            SIDE_PANEL_SECTION_CACHE_TTL.COLLECTION,
          ),
        ),
    };
  }
}
