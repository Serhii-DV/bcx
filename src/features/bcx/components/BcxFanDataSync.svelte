<script lang="ts">
import { RefreshCcw } from '@lucide/svelte';
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
  <div class="description">
    <h3>Keep your saved lists up to date</h3>
    <p>Update your Collection, Wishlist, Following Bands, and Following Genres in BCX after buying music, editing your wishlist, or changing who you follow.</p>
    <p class="saved-history"><strong>Your history stays saved.</strong> Sync keeps previous entries, even when they disappear from your Bandcamp lists.</p>
  </div>
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
    <table class="last-synced">
      <caption>
        <span class="history-heading"><RefreshCcw size={14} aria-hidden="true" />Last synced</span>
        <span class="history-subtitle">Your saved Bandcamp lists</span>
      </caption>
      <tbody>
        {#each FAN_DATASETS as dataset}
          <tr>
            <th scope="row">{datasetLabels[dataset]}</th>
            <td><span class="sync-date" class:never={!syncedAt[dataset]}>{syncedAt[dataset] ? new Date(syncedAt[dataset]).toLocaleString() : 'Never synced'}</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
  {#if account && hasSaved && !FAN_DATASETS.some((dataset) => syncedAt[dataset]) && !running && ownJob?.state !== 'error' && ownJob?.state !== 'cancelled' && !error}<p>Your saved lists are shown. Sync merges fresh Bandcamp data and keeps missing entries.</p>{/if}
  {#if !account}<p>Sign in to Bandcamp and reload the page to sync saved data.</p>{/if}
  {#if jobReadError}<p role="alert">{jobReadError}</p>{/if}
  {#if error}<p role="alert">{error}</p>{/if}
</div>

<style>
  .fan-sync { margin: 16px; font-size: 0.75rem; color: #d1d5db; line-height: 1.5; }
  h2 { margin-bottom: 16px; color: #f9fafb; font-size: 0.875rem; font-weight: 700; }
  .description { margin-bottom: 20px; padding: 16px; border: 1px solid #374151; border-left: 3px solid #04b1fe; border-radius: 8px; background: #1f2937; line-height: 1.7; }
  .description h3 { margin: 0 0 8px; color: #f9fafb; font-weight: 600; }
  .description p { margin: 0; }
  .description .saved-history { margin-top: 14px; padding-top: 12px; border-top: 1px solid #374151; color: #9ca3af; }
  .saved-history strong { color: #d1d5db; font-weight: 600; }
  .actions { display: flex; flex-wrap: wrap; gap: 8px; }
  button, select { background: #374151; color: #f9fafb; border: 1px solid #4b5563; border-radius: 6px; padding: 7px 10px; }
  select { flex: 1; min-width: 0; max-width: 100%; }
  button { cursor: pointer; }
  button:disabled, select:disabled { opacity: 0.5; cursor: default; }
  button:focus-visible, select:focus-visible { outline: 2px solid #04b1fe; outline-offset: 2px; }
  p { margin-top: 12px; overflow-wrap: anywhere; }
  .status { margin-top: 12px; }
  .status:empty { margin: 0; }
  .last-synced { width: max-content; max-width: 100%; margin-top: 24px; border: 1px solid #374151; border-collapse: separate; border-spacing: 0; border-radius: 0 0 8px 8px; background: #111827; font-size: inherit; text-align: left; }
  .last-synced caption { padding: 12px 16px; border: 1px solid #374151; border-bottom: 0; border-radius: 8px 8px 0 0; background: #1f2937; text-align: left; }
  .history-heading { display: flex; align-items: center; gap: 8px; color: #f9fafb; font-weight: 600; }
  .history-subtitle { display: block; margin-top: 4px; color: #9ca3af; font-size: 0.6875rem; }
  .last-synced th, .last-synced td { padding: 10px 16px; border-bottom: 1px solid #263244; vertical-align: middle; }
  .last-synced th { font-weight: 500; }
  .last-synced td { padding-left: 0; }
  .last-synced tr:nth-child(even) { background: #182231; }
  .sync-date { display: inline-block; padding: 3px 8px; border: 1px solid #164e63; border-radius: 5px; background: #083344; color: #a5f3fc; font-size: 0.6875rem; font-variant-numeric: tabular-nums; }
  .sync-date.never { border-color: #374151; background: #1f2937; color: #9ca3af; }
  .last-synced tr:last-child th, .last-synced tr:last-child td { border-bottom: 0; }
  .last-synced tr:last-child th { border-bottom-left-radius: 8px; }
  .last-synced tr:last-child td { border-bottom-right-radius: 8px; }
</style>
