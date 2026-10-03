<script lang="ts">
import { RefreshCcw } from '@lucide/svelte';
import { Tabs } from 'bits-ui';
import { MessageType } from 'src/core/message';
import {
  formatStorageBytes,
  isStorageAreaUsage,
  type StorageAreaUsage,
  type StorageUsage,
} from 'src/features/bcx/storageUsage';
import { ICON_DATABASE, ICON_HISTORY } from 'src/features/treeview/utils/icon';
import { getErrorMessage } from 'src/utils/getErrorMessage';
import { onMount } from 'svelte';
import type { ActivityProcess } from '../activityLog';
import BcxSectionTabs from './BcxSectionTabs.svelte';
import BcxStorageBar from './BcxStorageBar.svelte';
import BcxStorageHistory from './BcxStorageHistory.svelte';

let {
  onViewLog,
}: { onViewLog?: (process: ActivityProcess, id?: string) => void } = $props();
let measurementId = $state('');
let historyId = $state('');
let view = $state('current');
let currentArea = $state('local');
let historyChart = $state('total');
let historyPanel = $state<ReturnType<typeof BcxStorageHistory>>();
let historyLoading = $state(false);
let historyDays = $state(30);
let historyArea = $state<StorageAreaUsage['id'] | 'all'>('all');
let usage = $state<StorageUsage>();
let loading = $state(false);
const refreshing = $derived(view === 'history' ? historyLoading : loading);
let error = $state('');
let generation = 0;
const measuredAreas = $derived(
  usage?.areas.filter((area) => !area.error) ?? [],
);
const total = $derived(
  measuredAreas.reduce((sum, area) => sum + area.bytes, 0),
);
const incomplete = $derived(usage?.areas.some((area) => !!area.error));

async function refresh() {
  const token = ++generation;
  loading = true;
  error = '';
  measurementId = '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      (async () => {
        const response: unknown = await chrome.runtime.sendMessage({
          type: MessageType.MEASURE_STORAGE,
        });
        if (
          !response ||
          typeof response !== 'object' ||
          !('ok' in response) ||
          response.ok !== true ||
          !('usage' in response)
        ) {
          throw new Error(
            response &&
              typeof response === 'object' &&
              'error' in response &&
              typeof response.error === 'string'
              ? response.error
              : 'Could not measure storage. Reload BCX and retry.',
          );
        }
        const value = response.usage;
        if (
          !value ||
          typeof value !== 'object' ||
          !('areas' in value) ||
          !Array.isArray(value.areas) ||
          value.areas.length !== 3 ||
          !value.areas.every(isStorageAreaUsage) ||
          new Set(value.areas.map((area) => area.id)).size !== 3 ||
          !('measuredAt' in value) ||
          typeof value.measuredAt !== 'string' ||
          !Number.isFinite(Date.parse(value.measuredAt))
        )
          throw new Error('Invalid storage measurement response.');
        if (
          token === generation &&
          'id' in response &&
          typeof response.id === 'string'
        )
          measurementId = response.id;
        return { areas: value.areas, measuredAt: new Date(value.measuredAt) };
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(new Error('Storage measurement timed out. Please retry.')),
          10000,
        );
      }),
    ]);
    if (token === generation) usage = result;
  } catch (reason) {
    if (token === generation)
      error = getErrorMessage(reason, 'Could not measure storage.');
  } finally {
    clearTimeout(timer);
    if (token === generation) loading = false;
  }
}

onMount(() => {
  void refresh();
  return () => {
    generation++;
  };
});
</script>

<section class="storage-panel" aria-label="Extension storage" aria-busy={refreshing}>
  <Tabs.Root bind:value={view} class="bcx-panel-body">
    <BcxSectionTabs
      tabs={[{ id: 'current', label: 'Current', image: ICON_DATABASE }, { id: 'history', label: 'History', image: ICON_HISTORY }]}
      bind:value={view}
      label="Storage view"
      wrapActions={view === 'history'}
    >
      {#snippet actions()}
        {#if onViewLog}<button class="bcx-section-tab" onclick={() => onViewLog?.(view === 'history' ? 'storage-history' : 'storage', view === 'history' ? historyId : measurementId)}>View log</button>{/if}
        {#if view === 'history'}
          <label class="storage-filter">Period <select bind:value={historyDays}><option value={30}>30 days</option><option value={90}>90 days</option><option value={365}>365 days</option></select></label>
          <label class="storage-filter">Storage <select bind:value={historyArea}><option value="all">All storage</option><option value="local">Local data</option><option value="session">Session memory</option><option value="sync">Chrome sync</option></select></label>
        {/if}
        <button class="bcx-section-tab" onclick={() => view === 'history' ? historyPanel?.refresh() : refresh()} disabled={refreshing || (view === 'history' && !historyPanel)} aria-label={`Refresh ${view === 'history' ? 'storage history' : 'current storage'}`}>
          <RefreshCcw size={16} class="shrink-0" aria-hidden="true" />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      {/snippet}
    </BcxSectionTabs>
  <Tabs.Content value="history" class="bcx-tab-content">
    <BcxStorageHistory bind:this={historyPanel} bind:activityId={historyId} bind:loading={historyLoading} bind:selectedChart={historyChart} days={historyDays} area={historyArea} />
  </Tabs.Content>
  <Tabs.Content value="current" class="bcx-tab-content">
  <Tabs.Root bind:value={currentArea} class="bcx-panel-body">
    <BcxSectionTabs
      tabs={[{ id: 'local', label: 'Local data' }, { id: 'session', label: 'Session memory' }, { id: 'sync', label: 'Chrome sync storage' }]}
      bind:value={currentArea}
      label="Current storage areas"
    />
  <div class="bcx-tab-content bcx-info-scroll">
  <div class="storage-content">
  {#if error}<p role="alert">{error}</p>{/if}
  {#if usage}
    <div class="storage-total" role="status">
      <span>{incomplete ? 'Total measured storage (partial)' : 'Total measured storage'}</span>
      <strong>{measuredAreas.length ? formatStorageBytes(total) : 'Unavailable'}</strong>
    </div>
    <p class="storage-note">Last measured: <time datetime={usage.measuredAt.toISOString()}>{usage.measuredAt.toLocaleString()}</time></p>
    {#each usage.areas as area (area.id)}
      <Tabs.Content value={area.id}>
      <section class="storage-area" aria-label={area.label}>
        <div class="storage-heading"><h3>{area.label}</h3>{#if !area.error}<strong>{formatStorageBytes(area.bytes)}</strong>{/if}</div>
        {#if area.error}
          <p role="alert">Unavailable: {area.error}</p>
        {:else}
          <p class="storage-note">{area.entries.toLocaleString()} stored entries{area.id === 'session' ? ' · Temporary memory' : ''}</p>
          {#if area.quota !== null}
            <progress max={area.quota} value={Math.min(area.bytes, area.quota)} aria-label={`${area.label} quota used`}></progress>
            <p class="storage-note">{(area.bytes / area.quota * 100).toFixed(1)}% of {formatStorageBytes(area.quota)} used · {formatStorageBytes(Math.max(0, area.quota - area.bytes))} available</p>
          {:else}
            <p class="storage-note">No fixed Chrome quota (unlimited storage permission).</p>
          {/if}
          {#if area.categories.length}
            <BcxStorageBar categories={area.categories} label={area.label} />
            <table>
              <caption class="sr-only">{area.label} by category</caption>
              <thead><tr><th scope="col">Category</th><th scope="col">Entries</th><th scope="col">Size</th></tr></thead>
              <tbody>
                {#each area.categories as category (category.label)}
                  <tr><th scope="row">{category.label}</th><td>{category.entries.toLocaleString()}</td><td>{formatStorageBytes(category.bytes)}</td></tr>
                {/each}
              </tbody>
            </table>
          {:else}
            <p class="storage-note">No stored data.</p>
          {/if}
        {/if}
      </section>
      </Tabs.Content>
    {/each}
    <p class="storage-note">Sizes are reported by Chrome for extension storage, including temporary session memory. They exclude extension installation files, browser history, and page storage. History is read from Chrome; any cached catalogs are counted above.</p>
    <p class="storage-note">Entries count storage keys, not individual releases inside saved lists. Data can change during measurement. Refresh to update. KB = 1,024 bytes.</p>
  {:else if loading}
    <p role="status">Measuring extension storage…</p>
  {/if}
  </div>
  </div>
  </Tabs.Root>
  </Tabs.Content>
  </Tabs.Root>
</section>

<style>
  .storage-panel { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; min-width: 0; overflow: hidden; color: #d1d5db; font-size: 0.8125rem; }
  .storage-content { padding: 0 12px 12px; }
  .storage-filter { display: inline-flex; align-items: center; gap: 4px; color: #9ca3af; }
  select { min-height: 28px; border: 1px solid #4b5563; border-radius: 4px; padding: 4px; color: #f3f4f6; background: #1f2937; }
  select:focus-visible { outline: 2px solid #04b1fe; outline-offset: 2px; }
  .storage-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  h3 { margin: 0; color: #f3f4f6; font-weight: 700; }
  h3 { font-size: 0.875rem; }
  button:disabled { cursor: wait; opacity: 0.6; }
  .storage-total { display: flex; flex-direction: column; gap: 4px; margin-top: 16px; }
  .storage-total strong { font-size: 1.5rem; color: #f3f4f6; }
  .storage-area { border-top: 1px solid #4b5563; padding: 12px 0; }
  .storage-note { color: #9ca3af; line-height: 1.5; margin: 6px 0 12px; }
  progress { display: block; width: 100%; height: 6px; accent-color: #38bdf8; }
  table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
  th, td { padding: 6px 4px; text-align: right; vertical-align: top; }
  th:first-child { text-align: left; overflow-wrap: anywhere; }
  tbody th { font-weight: 400; }
  td { white-space: nowrap; }
  thead { color: #9ca3af; }
  tbody tr { border-top: 1px solid rgb(75 85 99 / 40%); }
</style>
