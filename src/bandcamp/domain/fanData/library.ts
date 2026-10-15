import { requestFanLibrary } from './client';
import {
  type Availability,
  type AvailabilityList,
  type FanAccount,
  type FanDataset,
  type FanItem,
  type FanLibrary,
  type SavedFanList,
  validateItems,
} from './data';

export * from './data';

export async function readLibrary(
  fanId: number,
): Promise<FanLibrary | undefined> {
  return (await requestFanLibrary({ action: 'read-library', fanId })).library;
}

export async function readSavedList(
  dataset: FanDataset,
  fanId?: number,
): Promise<SavedFanList | undefined> {
  return (
    await requestFanLibrary({
      action: 'read-lists',
      datasets: [dataset],
      fanId,
    })
  ).lists[dataset];
}

export async function readListSummaries(fanId?: number) {
  return (await requestFanLibrary({ action: 'read-summary', fanId })).summaries;
}

export async function readSavedItems<T extends FanItem>(
  dataset: FanDataset,
  fanId?: number,
): Promise<T[]> {
  const list = await readSavedList(dataset, fanId);
  if (!list) return [];
  const ids = [...new Set([...list.current, ...Object.keys(list.records)])];
  return ids.map((id) => list.records[id] as T);
}

export async function savedListRevision(
  dataset: FanDataset,
  fanId?: number,
): Promise<string> {
  return (await requestFanLibrary({ action: 'revision', dataset, fanId }))
    .revision;
}

export async function readCurrentItems<T extends FanItem>(
  dataset: FanDataset,
  fanId?: number,
): Promise<T[]> {
  return ((await readCurrentLists([dataset], fanId))[dataset] ?? []) as T[];
}

export async function readCurrentLists(
  datasets: readonly FanDataset[],
  fanId?: number,
): Promise<Partial<Record<FanDataset, FanItem[]>>> {
  const { lists } = await requestFanLibrary({
    action: 'read-lists',
    datasets: [...datasets],
    fanId,
    currentOnly: true,
  });
  return Object.fromEntries(
    datasets.map((dataset) => {
      const list = lists[dataset];
      return [dataset, list ? list.current.map((id) => list.records[id]) : []];
    }),
  );
}

export async function saveSnapshot(
  account: FanAccount,
  dataset: FanDataset,
  items: unknown,
): Promise<void> {
  await requestFanLibrary({
    action: 'save-snapshot',
    account,
    dataset,
    items: validateItems(dataset, items),
  });
}

export async function readAvailability(
  fanId: number,
): Promise<{ availability: AvailabilityList; unavailable: AvailabilityList }> {
  const { availability, unavailable } = await requestFanLibrary({
    action: 'read-availability',
    fanId,
  });
  return { availability, unavailable };
}

export async function saveAvailability(
  fanId: number,
  id: string,
  result: Availability,
): Promise<void> {
  await saveAvailabilityBatch(fanId, { [id]: result });
}

export async function saveAvailabilityBatch(
  fanId: number,
  updates: AvailabilityList,
): Promise<void> {
  if (!Object.keys(updates).length) return;
  await requestFanLibrary({ action: 'save-availability', fanId, updates });
}
