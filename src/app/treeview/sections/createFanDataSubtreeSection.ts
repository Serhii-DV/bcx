import { TreeItemCache } from '../items/TreeItemCache';
import type { TreeItem } from '../TreeItem';
import { createTreeDataFromTreeItemChildren } from './treeDataFactory';
import type {
  PendingSidePanelSection,
  SidePanelSectionsContext,
} from './types';

export function createFanDataSubtreeSection(
  { pageDataContext, userKeyPart }: SidePanelSectionsContext,
  options: {
    cacheKey: string;
    icon: string;
    itemCountPath: string;
    label: string;
    ttl: number;
    createTreeItem: (username: string) => Promise<TreeItem>;
  },
): PendingSidePanelSection | null {
  if (!pageDataContext) {
    return null;
  }

  const fanData = pageDataContext.fanData;
  const pageData = pageDataContext.data;

  return {
    label: options.label,
    image: options.icon,
    childrenCount: pageData?.[options.itemCountPath]?.item_count,
    createTreeData: async () =>
      createTreeDataFromTreeItemChildren(
        await TreeItemCache.getOrCreate(
          TreeItemCache.subtreeKey(userKeyPart, options.cacheKey),
          () => options.createTreeItem(fanData.username || ''),
          options.ttl,
        ),
      ),
  };
}
