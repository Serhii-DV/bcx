import {
  isFanAccount,
  isFanDataset,
  readLibrary,
} from 'src/bandcamp/domain/fanData/library';
import { BandcampUrlFactory } from 'src/bandcamp/domain/url/factory';
import { appendFanArchive } from '../items/fanArchive';
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
    initialSelectedHref?: string;
    itemCountPath?: string;
    label: string;
    rootNavigation?: SidePanelSection['rootNavigation'];
    ttl: number;
    createTreeItem: (username: string, fanId?: number) => Promise<TreeItem>;
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

  const account = { fanId: fanData.fan_id, username: fanData.username };
  const dataset = isFanDataset(options.cacheKey) ? options.cacheKey : undefined;
  const sync = dataset
    ? { account: isFanAccount(account) ? account : undefined, dataset }
    : undefined;
  const fanId = sync?.account?.fanId;
  const section: SidePanelSection = {
    fanSync: sync,
    id: options.id,
    initialSelectedHref: options.initialSelectedHref,
    label: options.label,
    rootNavigation: sync ? 'tabs' : options.rootNavigation,
    image: options.icon,
    childrenCount:
      options.getChildrenCount?.(pageData) ??
      (options.itemCountPath
        ? pageData?.[options.itemCountPath]?.item_count
        : undefined),
    createTreeData: async () => {
      const library = fanId ? await readLibrary(fanId) : undefined;
      let item = await TreeItemCache.getOrCreate(
        TreeItemCache.subtreeKey(fanId ?? userKeyPart, options.cacheKey),
        () => options.createTreeItem(fanData.username || '', fanId),
        options.ttl,
        sync
          ? (library?.lists[sync.dataset]?.syncedAt ?? 'unsynced')
          : undefined,
      );
      if (sync) {
        if (sync.dataset === 'following-genres')
          item = {
            ...item,
            children: [
              {
                label: 'Current',
                children: item.children ?? [],
                childrenCount: item.children?.length ?? 0,
                childrenLoaded: true,
              },
            ],
          };
        item = await appendFanArchive(item, fanId, sync.dataset);
        section.childrenCount =
          library?.lists[sync.dataset]?.current.length ?? 0;
      }
      if (item.releaseCatalog) {
        section.navigationUrls = [
          BandcampUrlFactory.generateFanUrl(fanData.username || ''),
          BandcampUrlFactory.generateWishlistUrl(fanData.username || ''),
          ...item.releaseCatalog.albums.map((album) => album.url),
        ];
      }
      if (sync) {
        for (const root of item.children ?? []) root.hasChildren = true;
        assignStablePaths(item.children ?? []);
      }
      return createTreeDataFromTreeItemChildren(item);
    },
  };
  return section;
}

// Keep selected tabs and rows stable when sync inserts items or year groups.
function assignStablePaths(items: TreeItem[]) {
  const used = new Set<string>();
  for (const item of items) {
    const key = encodeURIComponent(item.href ?? item.label ?? '').replaceAll(
      '.',
      '%2E',
    );
    if (!used.has(key)) item.pathKey = key;
    used.add(key);
    if (item.children) assignStablePaths(item.children);
  }
}
