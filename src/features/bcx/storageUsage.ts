import { FAN_DATASETS } from 'src/bandcamp/domain/fanData/library';
import { StorageKey } from 'src/bandcamp/domain/storageKey';
import { getErrorMessage } from 'src/utils/getErrorMessage';
import { validate as isUuid } from 'uuid';

export interface StorageCategoryUsage {
  label: string;
  entries: number;
  bytes: number;
}

export interface StorageAreaUsage {
  id: 'local' | 'session' | 'sync';
  label: string;
  quota: number | null;
  bytes: number;
  entries: number;
  categories: StorageCategoryUsage[];
  error?: string;
}

export interface StorageUsage {
  areas: StorageAreaUsage[];
  measuredAt: Date;
}

function categoryForKey(key: string): string {
  if (StorageKey.isAlbumKey(key)) return 'Albums';
  if (StorageKey.isTrackKey(key)) return 'Tracks';
  if (StorageKey.isBandKey(key) || StorageKey.isBandsKey(key)) return 'Bands';
  if (
    key.startsWith('/fan-data/') ||
    FAN_DATASETS.some((dataset) => key === `/${dataset}`)
  )
    return 'Fan libraries and sync data';
  if (key.startsWith('/cache/')) return 'Cached catalogs';
  if (key.startsWith('/ui/')) return 'Settings and panel state';
  if (isUuid(key)) return 'URL lookups';
  return 'Other data';
}

async function measureArea(
  id: StorageAreaUsage['id'],
  label: string,
  unlimited: boolean,
): Promise<StorageAreaUsage> {
  const result: StorageAreaUsage = {
    id,
    label,
    quota: null,
    bytes: 0,
    entries: 0,
    categories: [],
  };
  try {
    const area = chrome.storage[id];
    if (!area) throw new Error('Storage is unavailable in this panel context.');
    result.quota = id === 'local' && unlimited ? null : area.QUOTA_BYTES;
    // Read keys and browser-reported sizes without loading saved library values.
    const keys = await area.getKeys();
    const groups = new Map<string, string[]>();
    for (const key of keys) {
      const label = categoryForKey(key);
      const group = groups.get(label) ?? [];
      group.push(key);
      groups.set(label, group);
    }
    const [bytes, categories] = await Promise.all([
      area.getBytesInUse(null),
      Promise.all(
        Array.from(groups, async ([label, keys]) => ({
          label,
          entries: keys.length,
          bytes: await area.getBytesInUse(keys),
        })),
      ),
    ]);
    return {
      ...result,
      bytes,
      entries: keys.length,
      categories: categories.sort(
        (a, b) => b.bytes - a.bytes || a.label.localeCompare(b.label),
      ),
    };
  } catch (error) {
    return {
      ...result,
      error: getErrorMessage(error, 'Could not measure storage.'),
    };
  }
}

export async function readStorageUsage(): Promise<StorageUsage> {
  const unlimited =
    chrome.runtime.getManifest().permissions?.includes('unlimitedStorage') ??
    false;
  const areas = await Promise.all([
    measureArea('local', 'Local data', unlimited),
    measureArea('session', 'Session memory', false),
    measureArea('sync', 'Chrome sync storage', false),
  ]);
  return { areas, measuredAt: new Date() };
}

export function formatStorageBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
