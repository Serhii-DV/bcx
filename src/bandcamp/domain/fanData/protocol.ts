import {
  type Availability,
  type AvailabilityList,
  type FanAccount,
  type FanDataset,
  type FanItem,
  type FanLibrary,
  isFanAccount,
  isFanDataset,
  itemId,
  type SavedFanList,
  validateItems,
} from './data';

export const FAN_LIBRARY_REVISION_KEY = '/fan-data/revision';
export interface FanLibraryChange {
  fanId: number;
  datasets: FanDataset[];
  revision: string;
}
export type FanLibraryRequest =
  | {
      action: 'read-lists';
      datasets: FanDataset[];
      fanId?: number;
      currentOnly?: boolean;
    }
  | { action: 'read-summary'; fanId?: number }
  | { action: 'read-library'; fanId: number }
  | { action: 'read-availability'; fanId: number }
  | { action: 'revision'; dataset?: FanDataset; fanId?: number }
  | {
      action: 'save-snapshot';
      account: FanAccount;
      dataset: FanDataset;
      items: FanItem[];
    }
  | { action: 'save-availability'; fanId: number; updates: AvailabilityList };
export interface FanListSummary {
  syncedAt: string;
  savedCount: number;
  currentCount: number;
}
export interface FanLibraryResponse {
  summaries: Partial<Record<FanDataset, FanListSummary>>;
  revision: string;
  lists: Partial<Record<FanDataset, SavedFanList>>;
  library?: FanLibrary;
  availability: AvailabilityList;
  unavailable: AvailabilityList;
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function isFanId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}
function isAvailability(value: unknown): value is Availability {
  if (
    !isRecord(value) ||
    !['available', 'unavailable', 'unknown'].includes(String(value.state)) ||
    typeof value.url !== 'string' ||
    typeof value.reason !== 'string' ||
    typeof value.checkedAt !== 'string'
  )
    return false;
  try {
    return ['http:', 'https:'].includes(new URL(value.url).protocol);
  } catch {
    return false;
  }
}
function isAvailabilityList(value: unknown): value is AvailabilityList {
  return (
    isRecord(value) &&
    Object.entries(value).every(([id, entry]) => !!id && isAvailability(entry))
  );
}
function isLists(
  value: unknown,
): value is Partial<Record<FanDataset, SavedFanList>> {
  if (!isRecord(value)) return false;
  try {
    return Object.entries(value).every(([dataset, list]) => {
      if (
        !isFanDataset(dataset) ||
        !isRecord(list) ||
        !isRecord(list.records) ||
        !Array.isArray(list.current) ||
        !list.current.every(
          (id) =>
            typeof id === 'string' &&
            isRecord(list.records) &&
            id in list.records,
        ) ||
        new Set(list.current).size !== list.current.length ||
        (list.syncedAt !== undefined && typeof list.syncedAt !== 'string')
      )
        return false;
      validateItems(dataset, Object.values(list.records));
      return Object.entries(list.records).every(
        ([id, item]) => itemId(item as FanItem) === id,
      );
    });
  } catch {
    return false;
  }
}
export function isFanLibraryChange(value: unknown): value is FanLibraryChange {
  return (
    isRecord(value) &&
    isFanId(value.fanId) &&
    typeof value.revision === 'string' &&
    Array.isArray(value.datasets) &&
    value.datasets.every(isFanDataset)
  );
}
export function isFanLibraryResponse(
  value: unknown,
): value is FanLibraryResponse {
  return (
    isRecord(value) &&
    typeof value.revision === 'string' &&
    isRecord(value.summaries) &&
    Object.entries(value.summaries).every(
      ([dataset, summary]) =>
        isFanDataset(dataset) &&
        isRecord(summary) &&
        typeof summary.syncedAt === 'string' &&
        typeof summary.savedCount === 'number' &&
        Number.isSafeInteger(summary.savedCount) &&
        summary.savedCount >= 0 &&
        typeof summary.currentCount === 'number' &&
        Number.isSafeInteger(summary.currentCount) &&
        summary.currentCount >= 0 &&
        summary.currentCount <= summary.savedCount,
    ) &&
    isLists(value.lists) &&
    isAvailabilityList(value.availability) &&
    isAvailabilityList(value.unavailable) &&
    (value.library === undefined ||
      (isRecord(value.library) &&
        value.library.version === 1 &&
        isFanAccount(value.library.account) &&
        typeof value.library.revision === 'string' &&
        isLists(value.library.lists)))
  );
}
export function parseFanLibraryRequest(value: unknown): FanLibraryRequest {
  if (!isRecord(value)) throw new Error('Invalid fan library request.');
  const fanId = value.fanId;
  switch (value.action) {
    case 'read-lists':
      if (
        Array.isArray(value.datasets) &&
        value.datasets.every(isFanDataset) &&
        (fanId === undefined || isFanId(fanId)) &&
        (value.currentOnly === undefined ||
          typeof value.currentOnly === 'boolean')
      )
        return {
          action: value.action,
          datasets: value.datasets,
          fanId,
          currentOnly: value.currentOnly,
        };
      break;
    case 'read-summary':
      if (fanId === undefined || isFanId(fanId))
        return { action: value.action, fanId };
      break;
    case 'read-library':
    case 'read-availability':
      if (isFanId(fanId)) return { action: value.action, fanId };
      break;
    case 'revision':
      if (
        (fanId === undefined || isFanId(fanId)) &&
        (value.dataset === undefined || isFanDataset(value.dataset))
      )
        return { action: value.action, fanId, dataset: value.dataset };
      break;
    case 'save-snapshot':
      if (isFanAccount(value.account) && isFanDataset(value.dataset))
        return {
          action: value.action,
          account: value.account,
          dataset: value.dataset,
          items: validateItems(value.dataset, value.items),
        };
      break;
    case 'save-availability':
      if (isFanId(fanId) && isAvailabilityList(value.updates))
        return { action: value.action, fanId, updates: value.updates };
      break;
  }
  throw new Error('Invalid fan library request.');
}
