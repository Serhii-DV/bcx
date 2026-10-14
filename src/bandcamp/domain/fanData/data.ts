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
}
export interface Availability {
  state: 'available' | 'unavailable' | 'unknown';
  checkedAt: string;
  url: string;
  reason: string;
}
export type AvailabilityList = Record<string, Availability>;
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
  if ('band_id' in item) return `b:${item.band_id}`;
  const url = new URL(item.tag_page_url, 'https://bandcamp.com');
  url.searchParams.sort();
  const path = url.pathname
    .replace(/^\/discover(?:\/|$)/, '')
    .replace(/^\//, '');
  return `g:${path}${url.search}`;
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

export function mergeFanItem(
  previous: FanItem | undefined,
  incoming: FanItem,
): FanItem {
  const fields = Object.fromEntries(
    Object.entries(incoming).filter(
      ([, value]) => value !== null && value !== undefined && value !== '',
    ),
  );
  return previous ? ({ ...previous, ...fields } as FanItem) : incoming;
}
