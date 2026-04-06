import { ExternalLink, Funnel } from '@lucide/svelte';
import { sessionStorage } from 'src/core/shared';
import { console } from 'src/utils/console';
import type { TreeItem } from '../TreeItem';
import type { TreeItemButton } from '../TreeItemButton';

const CACHE_VERSION = 2;
const CACHE_KEY_PREFIX = '/ui/main-tree-subtree-cache';
const DEFAULT_TTL_MS = 15 * 60 * 1000;

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
  iconKey?: string;
  buttons?: TreeItemButtonSnapshot[];
}

interface SubtreeSnapshot {
  createdAt: number;
  expiresAt: number;
  version: number;
  item: TreeItemSnapshot;
}

const memoryCache = new Map<string, SubtreeSnapshot>();

export class MainTreeDataCache {
  static subtreeKey(...parts: Array<string | number | null | undefined>): string {
    return `${CACHE_KEY_PREFIX}/${parts
      .filter((part) => part !== undefined && part !== null && `${part}` !== '')
      .join('/')}`;
  }

  static async getOrCreate(
    key: string,
    createFn: () => Promise<TreeItem>,
    ttlMs: number = DEFAULT_TTL_MS,
  ): Promise<TreeItem> {
    const cached = await this.get(key);
    if (cached) {
      return cached;
    }

    const item = await createFn();
    await this.set(key, item, ttlMs);
    return item;
  }

  static async get(key: string): Promise<TreeItem | null> {
    const logLabel = `[MainTreeDataCache.get:${key}]`;
    console.time(logLabel);

    const cacheResult = await this.getSnapshot(key);
    if (!cacheResult) {
      console.timeEnd(logLabel);
      console.log(logLabel, 'MISS');
      return null;
    }

    const item = deserializeTreeItem(cacheResult.snapshot.item);
    console.timeEnd(logLabel);
    console.log(logLabel, 'HIT', {
      layer: cacheResult.layer,
      createdAt: cacheResult.snapshot.createdAt,
      expiresAt: cacheResult.snapshot.expiresAt,
    });

    return item;
  }

  static async set(
    key: string,
    item: TreeItem,
    ttlMs: number = DEFAULT_TTL_MS,
  ): Promise<void> {
    const now = Date.now();
    const snapshot: SubtreeSnapshot = {
      createdAt: now,
      expiresAt: now + ttlMs,
      version: CACHE_VERSION,
      item: serializeTreeItem(item),
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
  ): Promise<{ snapshot: SubtreeSnapshot; layer: 'memory' | 'session' } | null> {
    const now = Date.now();
    const memorySnapshot = memoryCache.get(key);
    if (memorySnapshot) {
      if (this.isFresh(memorySnapshot, now)) {
        return { snapshot: memorySnapshot, layer: 'memory' };
      }

      memoryCache.delete(key);
    }

    const sessionSnapshot = await sessionStorage.getByKey<SubtreeSnapshot>(key);
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

  private static isFresh(snapshot: SubtreeSnapshot, now: number): boolean {
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
    iconKey: getIconKey(item.icon),
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
    icon: getIconFromKey(item.iconKey),
    buttons,
    children: item.children?.map(deserializeTreeItem),
  };
}

function getIconKey(icon: any): string | undefined {
  if (icon === ExternalLink) {
    return 'external-link';
  }

  if (icon === Funnel) {
    return 'funnel';
  }

  return undefined;
}

function getIconFromKey(iconKey?: string): any {
  switch (iconKey) {
    case 'external-link':
      return ExternalLink;
    case 'funnel':
      return Funnel;
    default:
      return undefined;
  }
}
