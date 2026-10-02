import type { StorageSnapshot } from './storageHistory';
import { storageDay } from './storageHistory';
import type { StorageAreaUsage } from './storageUsage';

export interface StorageChartPoint {
  day: string;
  measuredAt?: string;
  values: number[] | null;
}

export function historyDays(days: number, now = new Date()): string[] {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - days + index + 1);
    return storageDay(date);
  });
}

export function chartHistory(
  snapshots: StorageSnapshot[],
  days: string[],
  area: StorageAreaUsage['id'] | 'all',
) {
  const byDay = new Map(snapshots.map((snapshot) => [snapshot.day, snapshot]));
  const rows = days.map((day) => {
    const snapshot = byDay.get(day);
    const areas = snapshot?.areas.filter(
      (item) => area === 'all' || item.id === area,
    );
    return {
      day,
      measuredAt: snapshot?.measuredAt,
      areas: areas?.length && areas.every((item) => !item.error) ? areas : null,
    };
  });
  const labels = [
    ...new Set(
      rows.flatMap(
        (row) =>
          row.areas?.flatMap((item) =>
            item.categories.map((category) => category.label),
          ) ?? [],
      ),
    ),
  ].sort();
  const totals: StorageChartPoint[] = rows.map((row) => ({
    day: row.day,
    measuredAt: row.measuredAt,
    values: row.areas
      ? [row.areas.reduce((sum, item) => sum + item.bytes, 0)]
      : null,
  }));
  const categories: StorageChartPoint[] = rows.map((row) => ({
    day: row.day,
    measuredAt: row.measuredAt,
    values: row.areas
      ? labels.map(
          (label) =>
            row.areas?.reduce(
              (sum, item) =>
                sum +
                item.categories
                  .filter((category) => category.label === label)
                  .reduce((bytes, category) => bytes + category.bytes, 0),
              0,
            ) ?? 0,
        )
      : null,
  }));
  const entries: StorageChartPoint[] = rows.map((row) => ({
    day: row.day,
    measuredAt: row.measuredAt,
    values: row.areas
      ? [row.areas.reduce((sum, item) => sum + item.entries, 0)]
      : null,
  }));
  return { totals, categories, entries, labels };
}
