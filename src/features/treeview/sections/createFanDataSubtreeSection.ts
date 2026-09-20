import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
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
    itemCountPath?: string;
    label: string;
    rootNavigation?: SidePanelSection['rootNavigation'];
    ttl: number;
    createTreeItem: (username: string) => Promise<TreeItem>;
    getChildrenCount?: (
      pageData: PageDataContext['data'],
    ) => number | undefined;
  },
): SidePanelSection | null {
  if (!pageDataContext) {
    return null;
  }

  const fanData = pageDataContext.fanData;
  const pageData = pageDataContext.data;

  const section: SidePanelSection = {
    id: options.id,
    label: options.label,
    rootNavigation: options.rootNavigation,
    image: options.icon,
    childrenCount:
      options.getChildrenCount?.(pageData) ??
      (options.itemCountPath
        ? pageData?.[options.itemCountPath]?.item_count
        : undefined),
    createTreeData: async () => {
      const item = await TreeItemCache.getOrCreate(
        TreeItemCache.subtreeKey(userKeyPart, options.cacheKey),
        () => options.createTreeItem(fanData.username || ''),
        options.ttl,
      );
      if (item.releaseCatalog) {
        section.navigationUrls = [
          BandcampUrlFactory.generateFanUrl(fanData.username || ''),
          BandcampUrlFactory.generateWishlistUrl(fanData.username || ''),
          ...item.releaseCatalog.albums.map((album) => album.url),
        ];
      }
      return createTreeDataFromTreeItemChildren(item);
    },
  };
  return section;
}
