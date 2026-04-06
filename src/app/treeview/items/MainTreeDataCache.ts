import type { Album } from 'src/bandcamp/domain/album/album';
import type { Band } from 'src/bandcamp/domain/band/band';
import { bandcampPageData } from 'src/bandcamp/domain/shared';
import { sessionStorage } from 'src/core/shared';
import type { Url } from 'src/core/url';
import { console } from 'src/utils/console';
import { TreeData } from '../TreeData';
import type { TreeItem } from '../TreeItem';
import type { TreeItemButton } from '../TreeItemButton';

const CACHE_VERSION = 1;
const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_KEY_PREFIX = '/ui/main-tree-cache';

interface TreeItemButtonSnapshot {
  title: string;
  href?: string;
}

interface TreeItemSnapshot {
  id?: string;
  label?: string;
  children?: TreeItemSnapshot[];
  open?: boolean;
  level?: number;
  path?: string;
  href?: string;
  image?: string;
  query?: string;
  keywords?: string[];
  buttons?: TreeItemButtonSnapshot[];
}

interface MainTreeSnapshot {
  createdAt: number;
  expiresAt: number;
  version: number;
  items: TreeItemSnapshot[];
}

type CacheLayer = 'memory' | 'session';

const memoryCache = new Map<string, MainTreeSnapshot>();

export class MainTreeDataCache {
  static buildKey(url: Url, band: Band | null, album: Album | null): string {
    const fanId = bandcampPageData?.fanData?.fan_id ?? 0;
    const bandId = band?.id ?? 0;
    const albumId = album?.id ?? 0;
    return `${CACHE_KEY_PREFIX}/v${CACHE_VERSION}/${fanId}/${url.uuid}/${bandId}/${albumId}`;
  }

  static async get(key: string): Promise<TreeData | null> {
    const logLabel = '[MainTreeDataCache.get]';
    console.time(logLabel);
    const cacheResult = await this.getSnapshot(key);
    if (!cacheResult) {
      console.timeEnd(logLabel);
      console.log(logLabel, 'MISS', { key });
      return null;
    }

    const treeData = new TreeData(cacheResult.snapshot.items.map(deserializeTreeItem));
    console.timeEnd(logLabel);
    console.log(logLabel, 'HIT', {
      key,
      layer: cacheResult.layer,
      createdAt: cacheResult.snapshot.createdAt,
      expiresAt: cacheResult.snapshot.expiresAt,
      items: cacheResult.snapshot.items.length,
    });
    return treeData;
  }

  static async set(key: string, treeData: TreeData): Promise<void> {
    const now = Date.now();
    const snapshot: MainTreeSnapshot = {
      createdAt: now,
      expiresAt: now + CACHE_TTL_MS,
      version: CACHE_VERSION,
      items: treeData.items.map(serializeTreeItem),
    };

    memoryCache.set(key, snapshot);
    await sessionStorage.setByKey(key, snapshot);
  }

  static async invalidateAll(): Promise<void> {
    memoryCache.clear();
    const keys = await sessionStorage.getKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_KEY_PREFIX));
    if (cacheKeys.length === 0) {
      return;
    }

    await sessionStorage.remove(cacheKeys);
    console.log('[MainTreeDataCache.invalidateAll]', cacheKeys.length);
  }

  private static async getSnapshot(
    key: string,
  ): Promise<{ snapshot: MainTreeSnapshot; layer: CacheLayer } | null> {
    const now = Date.now();
    const memorySnapshot = memoryCache.get(key);
    if (memorySnapshot) {
      if (this.isFresh(memorySnapshot, now)) {
        return { snapshot: memorySnapshot, layer: 'memory' };
      }
      memoryCache.delete(key);
    }

    const sessionSnapshot = await sessionStorage.getByKey<MainTreeSnapshot>(key);
    if (!sessionSnapshot) {
      return null;
    }

    if (!this.isFresh(sessionSnapshot, now)) {
      await sessionStorage.remove(key);
      return null;
    }

    memoryCache.set(key, sessionSnapshot);
    return { snapshot: sessionSnapshot, layer: 'session' };
  }

  private static isFresh(snapshot: MainTreeSnapshot, now: number): boolean {
    return snapshot.version === CACHE_VERSION && now <= snapshot.expiresAt;
  }
}

function serializeTreeItem(item: TreeItem): TreeItemSnapshot {
  const buttons = (item.buttons || [])
    .filter((button) => !!button.href)
    .map((button) => ({
      title: button.title,
      href: button.href,
    }));

  return {
    id: item.id,
    label: item.label,
    open: item.open,
    level: item.level,
    path: item.path,
    href: item.href,
    image: item.image,
    query: item.query,
    keywords: item.keywords,
    buttons: buttons.length > 0 ? buttons : undefined,
    children: item.children?.map(serializeTreeItem),
  };
}

function deserializeTreeItem(item: TreeItemSnapshot): TreeItem {
  const buttons: TreeItemButton[] | undefined = item.buttons?.map((button) => ({
    title: button.title,
    icon: undefined,
    href: button.href,
  }));

  return {
    id: item.id,
    label: item.label,
    open: item.open,
    level: item.level,
    path: item.path,
    href: item.href,
    image: item.image,
    query: item.query,
    keywords: item.keywords,
    buttons,
    children: item.children?.map(deserializeTreeItem),
  };
}
