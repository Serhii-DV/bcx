<script lang="ts">
import {
  FAN_DATASETS,
  type FanAccount,
  type FanDataset,
  libraryKey,
  readLibrary,
  readSavedItems,
  SAVED_LIST_OWNERS_KEY,
} from 'src/bandcamp/domain/fanData/library';
import {
  FAN_SYNC_PROTOCOL_VERSION,
  type FanSyncAction,
  type FanSyncJob,
} from 'src/bandcamp/domain/fanData/sync';
import { MessageType } from 'src/core/message';
import { getErrorMessage } from 'src/utils/getErrorMessage';
import { onMount } from 'svelte';

const datasetLabels: Record<FanDataset, string> = {
  collection: 'Collection',
  wishlist: 'Wishlist',
  'following-bands': 'Following Bands',
  'following-genres': 'Following Genres',
};

let {
  account,
  job,
  jobReadError = '',
}: {
  account?: FanAccount;
  job?: FanSyncJob;
  jobReadError?: string;
} = $props();
let error = $state('');
let sending = $state(false);
let syncedAt = $state<Partial<Record<FanDataset, string>>>({});
let hasSaved = $state(false);
let action = $state<FanDataset | 'all' | 'check'>('all');
const actionButtonLabel = $derived(
  action === 'all'
    ? 'Sync all'
    : action === 'check'
      ? 'Check availability'
      : `Sync ${datasetLabels[action]}`,
);
const running = $derived(job?.state === 'running');
const ownJob = $derived(
  account && job?.account.fanId === account.fanId ? job : undefined,
);
let generation = 0;
async function refresh() {
  const token = ++generation;
  try {
    const [library, savedLists] = await Promise.all([
      account ? readLibrary(account.fanId) : undefined,
      Promise.all(
        FAN_DATASETS.map((dataset) => readSavedItems(dataset, account?.fanId)),
      ),
    ]);
    if (token !== generation) return;
    syncedAt = Object.fromEntries(
      FAN_DATASETS.map((dataset) => [
        dataset,
        library?.lists[dataset]?.syncedAt,
      ]),
    );
    hasSaved = savedLists.some((saved) => saved.length > 0);
  } catch (reason) {
    if (token === generation)
      error = getErrorMessage(reason, 'Could not read saved sync status.');
  }
}
$effect(() => {
  account;
  void refresh();
});
onMount(() => {
  const changed = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ) => {
    if (
      area === 'local' &&
      (SAVED_LIST_OWNERS_KEY in changes ||
        FAN_DATASETS.some((dataset) => `/${dataset}` in changes) ||
        (account && libraryKey(account.fanId) in changes))
    )
      void refresh();
  };
  chrome.storage.onChanged.addListener(changed);
  return () => {
    generation++;
    chrome.storage.onChanged.removeListener(changed);
  };
});
async function request(nextAction?: FanSyncAction) {
  if (nextAction && !account) {
    error = 'Sign in to Bandcamp and reload the page to sync saved data.';
    return;
  }
  sending = true;
  error = '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const response = await Promise.race([
      (async () => {
        if (nextAction) {
          let worker: unknown;
          try {
            worker = await chrome.runtime.sendMessage({
              type: MessageType.GET_FAN_SYNC_VERSION,
            });
          } catch {
            throw new Error(
              'BCX could not confirm the background update. Reload BCX in chrome://extensions and refresh this Bandcamp page.',
            );
          }
          if (
            !worker ||
            typeof worker !== 'object' ||
            !('protocolVersion' in worker) ||
            worker.protocolVersion !== FAN_SYNC_PROTOCOL_VERSION
          )
            throw new Error(
              'BCX background sync is out of date. Reload BCX in chrome://extensions and refresh this Bandcamp page.',
            );
        }
        return chrome.runtime.sendMessage(
          nextAction
            ? { type: MessageType.START_FAN_SYNC, account, action: nextAction }
            : { type: MessageType.CANCEL_FAN_SYNC },
        );
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error('BCX did not respond. Reload the extension and retry.'),
            ),
          10000,
        );
      }),
    ]);
    if (!response?.ok)
      throw new Error(response?.error || 'Could not start sync');
    await refresh();
  } catch (reason) {
    error = getErrorMessage(reason, 'Sync request failed');
  } finally {
    clearTimeout(timer);
    sending = false;
  }
}
</script>

<div class="fan-sync">
  <h2>Bandcamp data sync</h2>
  <div class="actions">
    <select aria-label="Bandcamp sync action" bind:value={action} disabled={!account || running || sending}>
      <option value="all">Sync all Bandcamp data</option>
      {#each FAN_DATASETS as dataset}
        <option value={dataset}>Sync {datasetLabels[dataset]}</option>
      {/each}
      <option value="check">Check saved pages’ availability</option>
    </select>
    <button disabled={!account || running || sending} onclick={() => request(action)}>{actionButtonLabel}</button>
    {#if running}<button disabled={sending} onclick={() => request()}>Cancel</button>{/if}
  </div>
  <p class="status" role={ownJob?.state === 'error' ? 'alert' : 'status'}>
    {#if ownJob}
      {#if ownJob.state === 'error' && ownJob.protocolVersion !== FAN_SYNC_PROTOCOL_VERSION}
        This saved sync error came from an older BCX version. Reload BCX in chrome://extensions, refresh Bandcamp, then sync again.
      {:else}{ownJob.message}{/if}
    {:else if running}Another Bandcamp sync is running.{/if}
  </p>
  {#if account}
    <div class="last-synced">
      <h3>Last synced</h3>
      {#each FAN_DATASETS as dataset}
        <div><span>{datasetLabels[dataset]}</span><span>{syncedAt[dataset] ? new Date(syncedAt[dataset]).toLocaleString() : 'Never'}</span></div>
      {/each}
    </div>
  {/if}
  {#if account && hasSaved && !FAN_DATASETS.some((dataset) => syncedAt[dataset]) && !running && ownJob?.state !== 'error' && ownJob?.state !== 'cancelled' && !error}<p>Your saved lists are shown. Sync merges fresh Bandcamp data and keeps missing entries.</p>{/if}
  {#if !account}<p>Sign in to Bandcamp and reload the page to sync saved data.</p>{/if}
  {#if jobReadError}<p role="alert">{jobReadError}</p>{/if}
  {#if error}<p role="alert">{error}</p>{/if}
</div>

<style>
  .fan-sync { margin: 8px; font-size: 0.75rem; color: #d1d5db; }
  h2 { margin-bottom: 8px; color: #f9fafb; font-size: 0.875rem; font-weight: 700; }
  h3 { margin: 12px 0 4px; color: #f9fafb; font-weight: 700; }
  .actions { display: flex; flex-wrap: wrap; gap: 4px; }
  button, select { background: #374151; color: #f9fafb; border: 1px solid #4b5563; border-radius: 4px; padding: 4px 8px; }
  select { flex: 1; min-width: 0; max-width: 100%; }
  button { cursor: pointer; }
  button:disabled, select:disabled { opacity: 0.5; cursor: default; }
  button:focus-visible, select:focus-visible { outline: 2px solid #04b1fe; }
  p { margin-top: 4px; overflow-wrap: anywhere; }
  .last-synced > div { display: flex; justify-content: space-between; gap: 8px; padding: 2px 0; }
</style>
