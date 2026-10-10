import { MessageType } from 'src/core/message';
import { startActivity, updateActivity } from 'src/features/bcx/activityLog';
import { getErrorMessage } from 'src/utils/getErrorMessage';
import { checkAvailability } from './availability';
import {
  type AvailabilityList,
  availabilityKey,
  FAN_DATASETS,
  type FanAccount,
  type FanDataset,
  type FanItem,
  fanStorage,
  importLegacyLists,
  isFanAccount,
  isFanDataset,
  itemId,
  readLibrary,
  saveAvailabilityBatch,
  saveSnapshot,
  unavailableKey,
} from './library';

export const FAN_SYNC_PROTOCOL_VERSION = 2;
export function isFanSyncTabUrl(value?: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      url.origin === 'https://bandcamp.com' &&
      /^\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname) &&
      /^#bcx-sync=[0-9a-f-]{36}$/.test(url.hash)
    );
  } catch {
    return false;
  }
}

export const FAN_SYNC_JOB_KEY = '/fan-data/sync-job';
export type FanSyncAction = FanDataset | 'all' | 'check' | 'import';
export interface FanSyncJob {
  id: string;
  account: FanAccount;
  action: FanSyncAction;
  state: 'running' | 'complete' | 'error' | 'cancelled';
  message: string;
  startedAt: number;
  tabId?: number;
  tabUrl?: string;
  completedDatasets?: FanDataset[];
  protocolVersion?: number;
  originTabId?: number;
}
let controller: AbortController | undefined;
let starting = false;
let recovery: Promise<void> | undefined;

export async function closeOwnedTab(job: FanSyncJob): Promise<void> {
  if (job.tabId === undefined || !job.tabUrl) return;
  try {
    const tab = await chrome.tabs.get(job.tabId);
    // A selected temporary tab belongs to the user now; closing it also hides its panel.
    if (tab.active || tab.id === job.originTabId) return;
    if (tab.url === job.tabUrl || tab.pendingUrl === job.tabUrl)
      await chrome.tabs.remove(job.tabId);
  } catch {
    /* The user may already have closed the temporary tab. */
  }
}
export function recoverFanSync(): Promise<void> {
  recovery ??= (async () => {
    const job = await fanStorage().getByKey<FanSyncJob>(FAN_SYNC_JOB_KEY);
    if (job?.state !== 'running') return;
    await updateActivity(
      job.id,
      'Sync was interrupted. Saved data is safe; sync again to continue.',
      'failed',
    );
    await closeOwnedTab(job);
    await fanStorage().set({
      [FAN_SYNC_JOB_KEY]: {
        ...job,
        state: 'error',
        message:
          'Sync was interrupted. Saved data is safe; sync again to continue.',
      },
    });
  })();
  return recovery;
}
export async function startFanSync(
  account: unknown,
  action: unknown,
): Promise<void> {
  if (
    !isFanAccount(account) ||
    !(
      isFanDataset(action) ||
      action === 'all' ||
      action === 'check' ||
      action === 'import'
    )
  ) {
    throw new Error('Open a Bandcamp page while signed in, then try again.');
  }
  if (starting || controller)
    throw new Error('A Bandcamp sync is already running.');
  starting = true;
  try {
    await recoverFanSync();
    const job: FanSyncJob = {
      id: crypto.randomUUID(),
      account,
      action,
      state: 'running',
      message: 'Opening your Collection page…',
      startedAt: Date.now(),
      completedDatasets: [],
      protocolVersion: FAN_SYNC_PROTOCOL_VERSION,
    };
    controller = new AbortController();
    await fanStorage().set({ [FAN_SYNC_JOB_KEY]: job });
    await startActivity(
      job.action === 'check' ? 'availability' : 'sync',
      job.action === 'check'
        ? 'Check saved-page availability'
        : `Sync ${job.action === 'all' ? 'all Bandcamp data' : job.action}`,
      false,
      job.id,
    );
    void runJob(job, controller).catch(console.error);
  } catch (error) {
    controller = undefined;
    throw error;
  } finally {
    starting = false;
  }
}
export function cancelFanSync() {
  controller?.abort(new Error('Sync cancelled. Saved data has been retained.'));
}

async function runJob(job: FanSyncJob, abort: AbortController) {
  const storage = fanStorage();
  const signal = abort.signal;
  // Keep the worker alive only for this bounded, user-requested operation.
  const heartbeat = setInterval(() => {
    void chrome.runtime.getPlatformInfo().catch(() => {});
  }, 20000);
  const timeout = setTimeout(
    () =>
      abort.abort(
        new Error('Sync timed out. Saved data is safe; retry to continue.'),
      ),
    12 * 60 * 1000,
  );
  const onRemoved = (id: number) => {
    if (id === job.tabId)
      abort.abort(
        new Error('The sync tab was closed. Saved data has been retained.'),
      );
  };
  chrome.tabs.onRemoved.addListener(onRemoved);
  let inconclusive = 0;
  const progress = async (message: string) => {
    signal.throwIfAborted();
    job.message = message;
    await storage.set({ [FAN_SYNC_JOB_KEY]: job });
    await updateActivity(
      job.id,
      message,
      undefined,
      message.startsWith('Checking saved pages '),
    );
  };
  try {
    if (job.action !== 'check') {
      const [origin] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      job.originTabId = origin?.id;
      job.tabUrl = `https://bandcamp.com/${job.account.username}#bcx-sync=${job.id}`;
      const tab = await chrome.tabs.create({
        url: job.tabUrl,
        active: false,
        ...(origin ? { windowId: origin.windowId } : {}),
      });
      if (tab.id === undefined) throw new Error('Could not open the sync tab.');
      job.tabId = tab.id;
      await progress('Waiting for your Collection page…');
      await waitForPage(tab.id, signal);
      // Verify the account even when only importing unassigned legacy entries.
      const identity = await requestPage(
        tab.id,
        job.account,
        'identity',
        signal,
      );
      if (!identity.ok)
        throw new Error(
          identity.error || 'Could not verify your Bandcamp account.',
        );
      if (job.action === 'import') await importLegacyLists(job.account);
      const datasets = isFanDataset(job.action) ? [job.action] : FAN_DATASETS;
      for (const dataset of datasets) {
        await progress(`Loading ${dataset}…`);
        const response = await requestPage(
          tab.id,
          job.account,
          dataset,
          signal,
        );
        signal.throwIfAborted();
        if (!response.ok)
          throw new Error(response.error || `Could not load ${dataset}.`);
        await progress(`Saving ${dataset}…`);
        await saveSnapshot(job.account, dataset, response.items);
        (job.completedDatasets ??= []).push(dataset);
        await updateActivity(
          job.id,
          `${dataset} saved: ${Array.isArray(response.items) ? response.items.length : 0} current items. Previous entries retained.`,
        );
      }
    }
    const library = await readLibrary(job.account.fanId);
    const unavailable =
      (await storage.getByKey<AvailabilityList>(
        unavailableKey(job.account.fanId),
      )) ?? {};
    const candidates = new Map<string, FanItem>();
    const currentRecords = new Map<string, FanItem>();
    // Prefer the newest current URL when the same release left one list but
    // remains in another (for example, after purchasing a wishlisted release).
    const listsByDate = Object.values(library?.lists ?? {}).sort((a, b) =>
      (a.syncedAt ?? '').localeCompare(b.syncedAt ?? ''),
    );
    for (const list of listsByDate) {
      for (const id of list.current) {
        if (list.records[id]) currentRecords.set(id, list.records[id]);
      }
    }
    for (const dataset of FAN_DATASETS) {
      if (dataset === 'following-genres') continue;
      if (isFanDataset(job.action) && job.action !== dataset) continue;
      const list = library?.lists[dataset];
      if (!list) continue;
      const current = new Set(list.current);
      for (const [id, item] of Object.entries(list.records)) {
        if (job.action === 'check' || !current.has(id) || unavailable[id])
          candidates.set(id, item);
      }
    }
    const previousChecks =
      (await storage.getByKey<AvailabilityList>(
        availabilityKey(job.account.fanId),
      )) ?? {};
    // Retry unfinished entries first, so a timed-out run makes forward progress.
    const orderedCandidates = [...candidates]
      .map(([id, item]) => currentRecords.get(id) ?? item)
      .sort((a, b) =>
        (previousChecks[itemId(a)]?.checkedAt ?? '').localeCompare(
          previousChecks[itemId(b)]?.checkedAt ?? '',
        ),
      );
    let checked = 0;
    let available = 0;
    let unavailableCount = 0;
    let changed = 0;
    let pendingAvailability: AvailabilityList = {};
    let checkpointAt = Date.now();
    const flushAvailability = async () => {
      if (!Object.keys(pendingAvailability).length) return;
      await saveAvailabilityBatch(job.account.fanId, pendingAvailability);
      pendingAvailability = {};
      checkpointAt = Date.now();
    };
    try {
      for (const item of orderedCandidates) {
        await progress(`Checking saved pages ${++checked}/${candidates.size}…`);
        const result = await checkAvailability(item, signal);
        signal.throwIfAborted();
        pendingAvailability[itemId(item)] = result;
        if (
          Object.keys(pendingAvailability).length >= 10 ||
          Date.now() - checkpointAt >= 5000
        )
          await flushAvailability();
        if (result.state === 'available') available++;
        else if (result.state === 'unavailable') unavailableCount++;
        else inconclusive++;
        const previous = previousChecks[itemId(item)];
        if (previous && previous.state !== result.state) changed++;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    } finally {
      // Persist completed checks even when a later request fails or is cancelled.
      await flushAvailability();
    }
    await updateActivity(
      job.id,
      `Availability: ${available} available, ${unavailableCount} unavailable, ${inconclusive} inconclusive; ${changed} changed. Inconclusive checks remain saved for retry.`,
    );
    job.state = 'complete';
    job.message = candidates.size
      ? `Saved data updated. Checked ${checked} pages; inconclusive checks remain saved for retry.`
      : 'Saved data updated.';
  } catch (error) {
    job.state = signal.aborted ? 'cancelled' : 'error';
    const reason = getErrorMessage(error, 'Unexpected sync error');
    const step = job.message.replace(/[.…]+$/, '');
    const updated = job.completedDatasets?.length
      ? ` Updated: ${job.completedDatasets.join(', ')}.`
      : '';
    job.message = signal.aborted
      ? reason
      : `${step} failed: ${reason} Saved data has been retained.${updated}`;
    console.error('[Fan sync]', step, reason);
  } finally {
    clearInterval(heartbeat);
    clearTimeout(timeout);
    chrome.tabs.onRemoved.removeListener(onRemoved);
    await closeOwnedTab(job);
    delete job.tabId;
    delete job.tabUrl;
    try {
      await storage.set({ [FAN_SYNC_JOB_KEY]: job });
      await updateActivity(
        job.id,
        job.message,
        job.state === 'complete'
          ? inconclusive
            ? 'warning'
            : 'completed'
          : job.state === 'cancelled'
            ? 'cancelled'
            : 'failed',
      );
    } catch (error) {
      await updateActivity(
        job.id,
        getErrorMessage(error, 'Could not save final sync status.'),
        'failed',
      );
      throw error;
    } finally {
      controller = undefined;
    }
  }
}
async function waitForPage(tabId: number, signal: AbortSignal) {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    signal.throwIfAborted();
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === 'complete') return;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(
    'Collection page did not load. Check your connection and sign in to Bandcamp.',
  );
}
async function requestPage(
  tabId: number,
  account: FanAccount,
  dataset: FanDataset | 'identity',
  signal: AbortSignal,
): Promise<{ ok: boolean; error?: string; items?: unknown }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => finish(new Error('Bandcamp took too long to respond. Retry sync.')),
      dataset === 'identity' ? 10000 : 180000,
    );
    const onAbort = () => finish(signal.reason);
    const finish = (
      error?: Error,
      response?: { ok: boolean; error?: string; items?: unknown },
    ) => {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      if (error) reject(error);
      else if (!response || typeof response.ok !== 'boolean')
        reject(new Error('Invalid response from Collection page.'));
      else resolve(response);
    };
    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) {
      onAbort();
      return;
    }
    chrome.tabs
      .sendMessage(tabId, { type: MessageType.LOAD_FAN_DATA, account, dataset })
      .then(
        (response) => finish(undefined, response),
        (error) => finish(error),
      );
  });
}
