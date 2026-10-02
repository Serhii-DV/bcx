import { Storage } from 'src/core/storage';
import { readStorageUsage, type StorageAreaUsage } from './storageUsage';

export const STORAGE_HISTORY_KEY = '/storage-history/daily';
export const STORAGE_HISTORY_DAYS = 365;

export interface StorageSnapshot {
  day: string;
  measuredAt: string;
  areas: StorageAreaUsage[];
}

export function storageDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isArea(value: unknown): value is StorageAreaUsage {
  return (
    isObject(value) &&
    ['local', 'session', 'sync'].includes(String(value.id)) &&
    typeof value.label === 'string' &&
    (value.quota === null || isCount(value.quota)) &&
    isCount(value.bytes) &&
    isCount(value.entries) &&
    (value.error === undefined || typeof value.error === 'string') &&
    Array.isArray(value.categories) &&
    value.categories.every(
      (category: unknown) =>
        isObject(category) &&
        typeof category.label === 'string' &&
        isCount(category.bytes) &&
        isCount(category.entries),
    )
  );
}

function isSnapshot(value: unknown): value is StorageSnapshot {
  return (
    isObject(value) &&
    typeof value.day === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.day) &&
    Number.isFinite(Date.parse(`${value.day}T12:00:00Z`)) &&
    new Date(`${value.day}T12:00:00Z`).toISOString().slice(0, 10) ===
      value.day &&
    typeof value.measuredAt === 'string' &&
    Number.isFinite(Date.parse(value.measuredAt)) &&
    Array.isArray(value.areas) &&
    value.areas.length === 3 &&
    value.areas.every(isArea) &&
    new Set(value.areas.map((area) => area.id)).size === 3
  );
}

export async function readStorageHistory(): Promise<StorageSnapshot[]> {
  const value = await new Storage(chrome.storage.local).getByKey<unknown>(
    STORAGE_HISTORY_KEY,
  );
  if (value === undefined) return [];
  if (
    !isObject(value) ||
    value.version !== 1 ||
    !Array.isArray(value.snapshots) ||
    !value.snapshots.every(isSnapshot) ||
    value.snapshots.length > STORAGE_HISTORY_DAYS ||
    new Set(value.snapshots.map((snapshot) => snapshot.day)).size !==
      value.snapshots.length
  ) {
    throw new Error(
      'Storage history is invalid or uses an unsupported version.',
    );
  }
  return value.snapshots;
}

// Only the background worker writes history. Serialize overlapping triggers.
let pending: Promise<void> = Promise.resolve();

export function captureStorageHistory(onlyIfMissing = false): Promise<void> {
  const capture = pending.then(async () => {
    const snapshots = await readStorageHistory();
    if (
      onlyIfMissing &&
      snapshots.some((item) => item.day === storageDay(new Date()))
    )
      return;
    const usage = await readStorageUsage();
    if (usage.areas.every((area) => area.error))
      throw new Error('Could not measure any storage area.');
    const day = storageDay(usage.measuredAt);
    const cutoff = new Date(usage.measuredAt);
    cutoff.setDate(cutoff.getDate() - STORAGE_HISTORY_DAYS + 1);
    const retained = snapshots.filter(
      (item) => item.day >= storageDay(cutoff) && item.day < day,
    );
    retained.push({
      day,
      measuredAt: usage.measuredAt.toISOString(),
      areas: usage.areas,
    });
    await new Storage(chrome.storage.local).setByKey(STORAGE_HISTORY_KEY, {
      version: 1,
      snapshots: retained.sort((a, b) => a.day.localeCompare(b.day)),
    });
  });
  pending = capture.catch(() => {});
  return capture;
}
