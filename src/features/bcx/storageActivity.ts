import { activityError, startActivity, updateActivity } from './activityLog';
import {
  formatStorageBytes,
  readStorageUsage,
  type StorageUsage,
} from './storageUsage';

export function storageMeasurementSummary(usage: StorageUsage): string {
  return usage.areas
    .map(
      (area) =>
        `${area.label}: ${area.error ?? `${formatStorageBytes(area.bytes)} (${area.entries} entries)`}`,
    )
    .join(' · ');
}
export function storageMeasurementStatus(usage: StorageUsage) {
  return usage.areas.every((area) => area.error)
    ? 'failed'
    : usage.areas.some((area) => area.error)
      ? 'warning'
      : 'completed';
}
export async function measureStorageActivity() {
  const id = await startActivity('storage', 'Measure extension storage');
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const usage = await Promise.race([
      readStorageUsage(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(new Error('Storage measurement timed out. Please retry.')),
          10000,
        );
      }),
    ]);
    await updateActivity(
      id,
      storageMeasurementSummary(usage),
      storageMeasurementStatus(usage),
    );
    return { id, usage };
  } catch (error) {
    await updateActivity(id, activityError(error), 'failed');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
