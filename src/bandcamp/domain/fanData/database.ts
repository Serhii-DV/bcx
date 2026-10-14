import { completed, openDatabase, readRequest } from '../storage/database';
import {
  type Availability,
  FAN_DATASETS,
  type FanAccount,
  type FanDataset,
  type FanItem,
  type FanLibrary,
  itemId,
  mergeFanItem,
  type SavedFanList,
} from './data';
import {
  FAN_LIBRARY_REVISION_KEY,
  type FanLibraryChange,
  type FanLibraryRequest,
  type FanLibraryResponse,
  parseFanLibraryRequest,
} from './protocol';

const FAN_STORES = [
  'fanAccounts',
  'fanLists',
  'fanMemberships',
  'fanAvailability',
  'meta',
];
interface AccountRecord extends FanAccount {
  revision: string;
}
interface ListRecord {
  fanId: number;
  dataset: FanDataset;
  syncedAt: string;
  revision: string;
  updatedOrder: number;
  currentCount: number;
  savedCount: number;
}
interface Membership {
  fanId: number;
  dataset: FanDataset;
  entityKey: string;
  current: 0 | 1;
  order: number;
  historyOrder: number;
  firstSeenAt: string;
  lastSeenAt: string;
  item: FanItem;
}
interface AvailabilityRecord {
  fanId: number;
  entityKey: string;
  latest: Availability;
  confirmedUnavailable?: Availability;
}
interface FanState {
  key: 'fan-state';
  revision: string;
  nextOrder: number;
}

function emptyResponse(): FanLibraryResponse {
  return {
    revision: '',
    lists: {},
    summaries: {},
    availability: {},
    unavailable: {},
  };
}
async function getState(transaction: IDBTransaction): Promise<FanState> {
  return (
    (await readRequest<FanState | undefined>(
      transaction.objectStore('meta').get('fan-state'),
    )) ?? { key: 'fan-state', revision: '', nextOrder: 0 }
  );
}
async function getList(
  transaction: IDBTransaction,
  dataset: FanDataset,
  fanId?: number,
): Promise<ListRecord | undefined> {
  const lists = transaction.objectStore('fanLists');
  if (fanId !== undefined)
    return readRequest<ListRecord | undefined>(lists.get([fanId, dataset]));
  const cursor = await readRequest<IDBCursorWithValue | null>(
    lists
      .index('datasetOrder')
      .openCursor(
        IDBKeyRange.bound([dataset, 0], [dataset, Number.MAX_SAFE_INTEGER]),
        'prev',
      ),
  );
  return cursor?.value as ListRecord | undefined;
}
async function readList(
  transaction: IDBTransaction,
  metadata: ListRecord,
  currentOnly = false,
): Promise<SavedFanList> {
  const memberships = transaction.objectStore('fanMemberships');
  const entries = await readRequest<Membership[]>(
    currentOnly
      ? memberships
          .index('current')
          .getAll([metadata.fanId, metadata.dataset, 1])
      : memberships.index('list').getAll([metadata.fanId, metadata.dataset]),
  );
  const current = entries
    .filter((entry) => entry.current === 1)
    .sort((a, b) => a.order - b.order);
  const history = entries
    .filter((entry) => entry.current === 0)
    .sort((a, b) => a.historyOrder - b.historyOrder);
  return {
    records: Object.fromEntries(
      [...current, ...history].map((entry) => [entry.entityKey, entry.item]),
    ),
    current: current.map((entry) => entry.entityKey),
    syncedAt: metadata.syncedAt,
  };
}
async function readLists(
  transaction: IDBTransaction,
  datasets: readonly FanDataset[],
  fanId?: number,
  currentOnly = false,
) {
  const pairs = await Promise.all(
    [...new Set(datasets)].map(async (dataset) => {
      const metadata = await getList(transaction, dataset, fanId);
      return [
        dataset,
        metadata
          ? await readList(transaction, metadata, currentOnly)
          : undefined,
      ] as const;
    }),
  );
  return Object.fromEntries(pairs.filter(([, list]) => list !== undefined));
}
async function publish(change: FanLibraryChange): Promise<void> {
  try {
    await chrome.storage.session.set({ [FAN_LIBRARY_REVISION_KEY]: change });
  } catch (error) {
    console.warn(
      'Fan library saved, but its change notification failed:',
      error,
    );
  }
}
async function saveSnapshot(
  transaction: IDBTransaction,
  request: Extract<FanLibraryRequest, { action: 'save-snapshot' }>,
  state: FanState,
): Promise<FanLibraryChange> {
  const { account, dataset, items } = request;
  const store = transaction.objectStore('fanMemberships');
  const existing = await readRequest<Membership[]>(
    store.index('list').getAll([account.fanId, dataset]),
  );
  const previous = new Map(existing.map((entry) => [entry.entityKey, entry]));
  const current = new Set(items.map(itemId));
  const now = new Date().toISOString();
  for (const entry of existing) {
    if (entry.current === 1 && !current.has(entry.entityKey))
      store.put({ ...entry, current: 0 });
  }
  items.forEach((item, order) => {
    const entityKey = itemId(item);
    const prior = previous.get(entityKey);
    const entry: Membership = {
      fanId: account.fanId,
      dataset,
      entityKey,
      current: 1,
      order,
      historyOrder: prior?.historyOrder ?? state.nextOrder++,
      firstSeenAt: prior?.firstSeenAt ?? now,
      lastSeenAt: now,
      item: mergeFanItem(prior?.item, item),
    };
    store.put(entry);
  });
  state.revision = crypto.randomUUID();
  transaction
    .objectStore('fanAccounts')
    .put({ ...account, revision: state.revision });
  const list: ListRecord = {
    fanId: account.fanId,
    dataset,
    syncedAt: now,
    revision: state.revision,
    updatedOrder: state.nextOrder++,
    currentCount: items.length,
    savedCount:
      existing.length +
      items.filter((item) => !previous.has(itemId(item))).length,
  };
  transaction.objectStore('fanLists').put(list);
  transaction.objectStore('meta').put(state);
  return {
    fanId: account.fanId,
    datasets: [dataset],
    revision: state.revision,
  };
}
async function saveAvailability(
  transaction: IDBTransaction,
  request: Extract<FanLibraryRequest, { action: 'save-availability' }>,
  state: FanState,
): Promise<FanLibraryChange | undefined> {
  const account = await readRequest<AccountRecord | undefined>(
    transaction.objectStore('fanAccounts').get(request.fanId),
  );
  if (!account || !Object.keys(request.updates).length) return undefined;
  const store = transaction.objectStore('fanAvailability');
  for (const [entityKey, latest] of Object.entries(request.updates)) {
    const previous = await readRequest<AvailabilityRecord | undefined>(
      store.get([request.fanId, entityKey]),
    );
    const entry: AvailabilityRecord = {
      fanId: request.fanId,
      entityKey,
      latest,
      confirmedUnavailable:
        latest.state === 'unavailable'
          ? latest
          : latest.state === 'available'
            ? undefined
            : previous?.confirmedUnavailable,
    };
    store.put(entry);
  }
  state.revision = crypto.randomUUID();
  transaction
    .objectStore('fanAccounts')
    .put({ ...account, revision: state.revision });
  transaction.objectStore('meta').put(state);
  return {
    fanId: request.fanId,
    datasets: [...FAN_DATASETS],
    revision: state.revision,
  };
}

export async function handleFanLibraryRequest(
  value: unknown,
): Promise<FanLibraryResponse> {
  const request = parseFanLibraryRequest(value);
  const database = await openDatabase();
  const writes =
    request.action === 'save-snapshot' ||
    request.action === 'save-availability';
  const transaction = database.transaction(
    FAN_STORES,
    writes ? 'readwrite' : 'readonly',
  );
  const done = completed(transaction);
  try {
    const result = emptyResponse();
    const state = await getState(transaction);
    let change: FanLibraryChange | undefined;
    switch (request.action) {
      case 'save-snapshot':
        change = await saveSnapshot(transaction, request, state);
        break;
      case 'save-availability':
        change = await saveAvailability(transaction, request, state);
        break;
      case 'read-lists':
        result.lists = await readLists(
          transaction,
          request.datasets,
          request.fanId,
          request.currentOnly,
        );
        break;
      case 'read-summary': {
        const pairs = await Promise.all(
          FAN_DATASETS.map(async (dataset) => {
            const list = await getList(transaction, dataset, request.fanId);
            return [
              dataset,
              list
                ? {
                    syncedAt: list.syncedAt,
                    savedCount: list.savedCount,
                    currentCount: list.currentCount,
                  }
                : undefined,
            ] as const;
          }),
        );
        result.summaries = Object.fromEntries(
          pairs.filter(([, summary]) => summary !== undefined),
        );
        break;
      }
      case 'read-library': {
        const account = await readRequest<AccountRecord | undefined>(
          transaction.objectStore('fanAccounts').get(request.fanId),
        );
        if (account) {
          const library: FanLibrary = {
            version: 1,
            account: { fanId: account.fanId, username: account.username },
            revision: account.revision,
            lists: Object.fromEntries(
              await Promise.all(
                (
                  await readRequest<ListRecord[]>(
                    transaction
                      .objectStore('fanLists')
                      .index('account')
                      .getAll(request.fanId),
                  )
                ).map(async (list) => [
                  list.dataset,
                  await readList(transaction, list),
                ]),
              ),
            ),
          };
          result.library = library;
        }
        break;
      }
      case 'read-availability': {
        const entries = await readRequest<AvailabilityRecord[]>(
          transaction
            .objectStore('fanAvailability')
            .index('account')
            .getAll(request.fanId),
        );
        result.availability = Object.fromEntries(
          entries.map((entry) => [entry.entityKey, entry.latest]),
        );
        result.unavailable = Object.fromEntries(
          entries.flatMap((entry) =>
            entry.confirmedUnavailable
              ? [[entry.entityKey, entry.confirmedUnavailable]]
              : [],
          ),
        );
        break;
      }
      case 'revision':
        if (request.dataset) {
          const metadata = await getList(
            transaction,
            request.dataset,
            request.fanId,
          );
          result.revision = metadata?.revision ?? '';
        }
        break;
    }
    if (request.action !== 'revision' || !request.dataset)
      result.revision = state.revision;
    await done;
    if (change) await publish(change);
    return result;
  } catch (error) {
    if (writes) {
      try {
        transaction.abort();
      } catch {
        /* Already aborted. */
      }
    }
    await done.catch(() => {});
    throw error;
  }
}
