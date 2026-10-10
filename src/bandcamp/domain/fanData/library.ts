import { Storage } from 'src/core/storage';
import type { BandcampItem, FollowingBandItem } from '../page/PageCollection';
import type { GenreItem } from '../types/CollectionPageData';

export const FAN_DATASETS = [
  'collection',
  'wishlist',
  'following-bands',
  'following-genres',
] as const;
export type FanDataset = (typeof FAN_DATASETS)[number];
export type FanItem = BandcampItem | FollowingBandItem | GenreItem;
export interface FanAccount {
  fanId: number;
  username: string;
}
export interface SavedFanList {
  records: Record<string, FanItem>;
  current: string[];
  syncedAt?: string;
}
export interface FanLibrary {
  version: 1;
  account: FanAccount;
  revision: string;
  lists: Partial<Record<FanDataset, SavedFanList>>;
  legacyImported?: boolean;
}
export interface Availability {
  state: 'available' | 'unavailable' | 'unknown';
  checkedAt: string;
  url: string;
  reason: string;
}
export type AvailabilityList = Record<string, Availability>;
export const libraryKey = (fanId: number) => `/fan-data/account/${fanId}`;
export const unavailableKey = (fanId: number) =>
  `${libraryKey(fanId)}/unavailable`;
export const availabilityKey = (fanId: number) =>
  `${libraryKey(fanId)}/availability`;
export const SAVED_LIST_OWNERS_KEY = '/fan-data/saved-list-owners';
type SavedListOwners = Partial<
  Record<FanDataset, { fanId: number; revision: string }>
>;
export const stagingKey = (fanId: number, dataset: FanDataset) =>
  `${libraryKey(fanId)}/staging/${dataset}`;
export const fanStorage = () => new Storage(chrome.storage.local);

export function isFanDataset(value: unknown): value is FanDataset {
  return FAN_DATASETS.some((dataset) => dataset === value);
}
export function isFanAccount(value: unknown): value is FanAccount {
  if (!value || typeof value !== 'object') return false;
  const account = value as Partial<FanAccount>;
  return (
    Number.isSafeInteger(account.fanId) &&
    Number(account.fanId) > 0 &&
    typeof account.username === 'string' &&
    /^[a-zA-Z0-9_-]+$/.test(account.username)
  );
}
export function itemId(item: FanItem): string {
  if ('tralbum_id' in item) return `${item.tralbum_type}:${item.tralbum_id}`;
  if ('band_id' in item) return `band:${item.band_id}`;
  return `genre:${item.tag_page_url}`;
}
export function itemUrl(item: FanItem): string {
  if ('tralbum_id' in item) return item.item_url;
  if ('band_id' in item)
    return `https://${item.url_hints.subdomain}.bandcamp.com/`;
  return new URL(item.tag_page_url, 'https://bandcamp.com').href;
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function isPositiveId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}
function isFanItem(dataset: FanDataset, item: unknown): item is FanItem {
  if (!isRecord(item)) return false;
  if (dataset === 'following-bands') {
    return (
      isPositiveId(item.band_id) &&
      typeof item.name === 'string' &&
      typeof item.date_followed === 'string' &&
      isRecord(item.url_hints) &&
      typeof item.url_hints.subdomain === 'string' &&
      /^[a-z0-9-]+$/i.test(item.url_hints.subdomain)
    );
  }
  if (dataset === 'following-genres') {
    return (
      typeof item.name === 'string' && typeof item.tag_page_url === 'string'
    );
  }
  return (
    (item.tralbum_type === 'a' || item.tralbum_type === 't') &&
    isPositiveId(item.tralbum_id) &&
    isPositiveId(item.band_id) &&
    typeof item.item_title === 'string' &&
    typeof item.band_name === 'string' &&
    typeof item.item_url === 'string' &&
    typeof item.item_art_id === 'number'
  );
}
export function validateItems(dataset: FanDataset, value: unknown): FanItem[] {
  if (!Array.isArray(value)) throw new Error(`Invalid ${dataset} response`);
  const items: unknown[] = value;
  const validated: FanItem[] = [];
  const ids = new Set<string>();
  for (const item of items) {
    if (!isFanItem(dataset, item)) throw new Error(`Invalid ${dataset} item`);
    const url = new URL(itemUrl(item));
    if (!['http:', 'https:'].includes(url.protocol))
      throw new Error('Invalid saved page URL');
    const id = itemId(item);
    if (ids.has(id))
      throw new Error(`Duplicate item in ${dataset}; sync was incomplete`);
    ids.add(id);
    validated.push(item);
  }
  return validated;
}
export async function readLibrary(
  fanId: number,
): Promise<FanLibrary | undefined> {
  const library = await fanStorage().getByKey<FanLibrary>(libraryKey(fanId));
  if (library && (library.version !== 1 || library.account.fanId !== fanId)) {
    throw new Error(
      'Unsupported saved library. Existing data has been preserved.',
    );
  }
  return library;
}
// Shared array keys remain compatible with the original saved-list readers.
export async function readSavedItems<T extends FanItem>(
  dataset: FanDataset,
  fanId?: number,
): Promise<T[]> {
  const items = await readSharedItems<T>(dataset, fanId);
  const list = fanId ? (await readLibrary(fanId))?.lists[dataset] : undefined;
  if (!list) return items;
  const records = {
    ...Object.fromEntries(items.map((item) => [itemId(item), item])),
    ...list.records,
  };
  const ids = [...new Set([...list.current, ...Object.keys(records)])];
  return ids.map((id) => records[id] as T);
}

async function readSharedItems<T extends FanItem>(
  dataset: FanDataset,
  fanId?: number,
): Promise<T[]> {
  const storage = fanStorage();
  const owners = await storage.getByKey<SavedListOwners>(SAVED_LIST_OWNERS_KEY);
  if (fanId && owners?.[dataset] && owners[dataset].fanId !== fanId) return [];
  return (await storage.getByKey<T[]>(`/${dataset}`)) ?? [];
}

export async function savedListRevision(
  dataset: FanDataset,
  fanId?: number,
): Promise<string> {
  const owner = (
    await fanStorage().getByKey<SavedListOwners>(SAVED_LIST_OWNERS_KEY)
  )?.[dataset];
  const list = fanId ? (await readLibrary(fanId))?.lists[dataset] : undefined;
  return `${!fanId || owner?.fanId === fanId ? (owner?.revision ?? '') : ''}:${list?.syncedAt ?? 'unsynced'}`;
}

export async function readCurrentItems<T extends FanItem>(
  dataset: FanDataset,
  fanId?: number,
): Promise<T[]> {
  return ((await readCurrentLists([dataset], fanId))[dataset] ?? []) as T[];
}

// Resolve account ownership once and share each account read across datasets.
export async function readCurrentLists(
  datasets: readonly FanDataset[],
  fanId?: number,
): Promise<Partial<Record<FanDataset, FanItem[]>>> {
  const storage = fanStorage();
  let owners = fanId
    ? undefined
    : await storage.getByKey<SavedListOwners>(SAVED_LIST_OWNERS_KEY);
  const libraries = new Map<number, Promise<FanLibrary | undefined>>();
  const lists = await Promise.all(
    datasets.map(async (dataset) => {
      const accountId = fanId ?? owners?.[dataset]?.fanId;
      if (!accountId) return undefined;
      let library = libraries.get(accountId);
      if (!library) {
        library = readLibrary(accountId);
        libraries.set(accountId, library);
      }
      return (await library)?.lists[dataset];
    }),
  );
  const missing = datasets.filter((_, index) => !lists[index]);
  if (missing.length && !owners)
    owners = await storage.getByKey<SavedListOwners>(SAVED_LIST_OWNERS_KEY);
  const allowed = missing.filter(
    (dataset) =>
      !fanId || !owners?.[dataset] || owners[dataset]?.fanId === fanId,
  );
  const shared = await storage.get(allowed.map((dataset) => `/${dataset}`));
  return Object.fromEntries(
    datasets.map((dataset, index) => {
      const list = lists[index];
      return [
        dataset,
        list
          ? list.current.flatMap((id) =>
              list.records[id] ? [list.records[id]] : [],
            )
          : (shared[`/${dataset}`] ?? []),
      ];
    }),
  );
}

// Preserve every previously seen record before publishing the latest membership.
export function mergeSnapshot(
  previous: SavedFanList | undefined,
  items: FanItem[],
): SavedFanList {
  const records = { ...previous?.records };
  for (const item of items) {
    const id = itemId(item);
    const fields = Object.fromEntries(
      Object.entries(item).filter(
        ([, value]) => value !== null && value !== undefined && value !== '',
      ),
    );
    records[id] = records[id]
      ? ({ ...records[id], ...fields } as FanItem)
      : item;
  }
  return {
    records,
    current: items.map(itemId),
    syncedAt: new Date().toISOString(),
  };
}
export async function saveSnapshot(
  account: FanAccount,
  dataset: FanDataset,
  items: unknown,
): Promise<void> {
  const validItems = validateItems(dataset, items);
  const storage = fanStorage();
  const temporaryKey = stagingKey(account.fanId, dataset);
  await storage.set({ [temporaryKey]: validItems });
  try {
    const library = (await readLibrary(account.fanId)) ?? {
      version: 1,
      account,
      revision: '',
      lists: {},
    };
    const saved = validateItems(
      dataset,
      await readSharedItems(dataset, account.fanId),
    );
    const previous = library.lists[dataset];
    const records = {
      ...Object.fromEntries(saved.map((item) => [itemId(item), item])),
      ...previous?.records,
    };
    library.account = account;
    library.lists[dataset] = mergeSnapshot(
      { records, current: previous?.current ?? [] },
      validItems,
    );
    library.revision = crypto.randomUUID();
    const list = library.lists[dataset];
    const ids = [...new Set([...list.current, ...Object.keys(list.records)])];
    const owners =
      (await storage.getByKey<SavedListOwners>(SAVED_LIST_OWNERS_KEY)) ?? {};
    await storage.set({
      [`/${dataset}`]: ids.map((id) => list.records[id]),
      [SAVED_LIST_OWNERS_KEY]: {
        ...owners,
        [dataset]: { fanId: account.fanId, revision: library.revision },
      },
      [libraryKey(account.fanId)]: library,
    });
  } finally {
    // Staged data is never read by panels; a failed merge leaves saved lists intact.
    await storage
      .remove(temporaryKey)
      .catch((error) =>
        console.warn('Could not remove staged fan data', error),
      );
  }
}

export async function importLegacyLists(account: FanAccount): Promise<void> {
  const library = (await readLibrary(account.fanId)) ?? {
    version: 1,
    account,
    revision: '',
    lists: {},
  };
  for (const dataset of FAN_DATASETS) {
    const legacy = await readSharedItems(dataset, account.fanId);
    if (!legacy) continue;
    const items = validateItems(dataset, legacy);
    const list = library.lists[dataset] ?? { records: {}, current: [] };
    for (const item of items) list.records[itemId(item)] ??= item;
    library.lists[dataset] = list;
  }
  library.legacyImported = true;
  library.revision = crypto.randomUUID();
  await fanStorage().set({ [libraryKey(account.fanId)]: library });
}

export async function saveAvailability(
  fanId: number,
  id: string,
  result: Availability,
): Promise<void> {
  return saveAvailabilityBatch(fanId, { [id]: result });
}

export async function saveAvailabilityBatch(
  fanId: number,
  updates: AvailabilityList,
): Promise<void> {
  if (!Object.keys(updates).length) return;
  const storage = fanStorage();
  const library = await readLibrary(fanId);
  if (!library) return;
  const results =
    (await storage.getByKey<AvailabilityList>(availabilityKey(fanId))) ?? {};
  const unavailable =
    (await storage.getByKey<AvailabilityList>(unavailableKey(fanId))) ?? {};
  for (const [id, result] of Object.entries(updates)) {
    results[id] = result;
    if (result.state === 'unavailable') unavailable[id] = result;
    if (result.state === 'available') delete unavailable[id];
  }
  // Inconclusive checks never erase an earlier confirmed result.
  library.revision = crypto.randomUUID();
  await storage.set({
    [availabilityKey(fanId)]: results,
    [unavailableKey(fanId)]: unavailable,
    [libraryKey(fanId)]: library,
  });
}
