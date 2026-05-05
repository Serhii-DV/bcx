import { TreeItemCache } from '../items/TreeItemCache';
import type { SidePanelSection } from '../SidePanelSection';
import type { TreeItem } from '../TreeItem';
import { createTreeDataFromTreeItemChildren } from './treeDataFactory';
import type { PageDataContext } from './types';

export function createFanDataSubtreeSection(
  pageDataContext: PageDataContext | null,
  userKeyPart: string,
  options: {
    cacheKey: string;
    icon: string;
    id: string;
    itemCountPath: string;
    label: string;
    ttl: number;
    createTreeItem: (username: string) => Promise<TreeItem>;
  },
): SidePanelSection | null {
  if (!pageDataContext) {
    return null;
  }

  const fanData = pageDataContext.fanData;
  const pageData = pageDataContext.data;

  return {
    id: options.id,
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
