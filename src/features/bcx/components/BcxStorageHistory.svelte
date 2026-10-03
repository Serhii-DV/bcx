<script lang="ts">
import { Tabs } from 'bits-ui';
import { MessageType } from 'src/core/message';
import { getErrorMessage } from 'src/utils/getErrorMessage';
import { onMount } from 'svelte';
import {
  readStorageHistory,
  STORAGE_HISTORY_KEY,
  type StorageSnapshot,
} from '../storageHistory';
import { chartHistory, historyDays } from '../storageHistoryChart';
import type { StorageAreaUsage } from '../storageUsage';
import BcxSectionTabs from './BcxSectionTabs.svelte';
import BcxStorageHistoryChart from './BcxStorageHistoryChart.svelte';

let snapshots = $state<StorageSnapshot[]>([]);
let error = $state('');
let {
  loading = $bindable(false),
  selectedChart = $bindable('total'),
  days = 30,
  area = 'all',
  activityId = $bindable(''),
}: {
  loading?: boolean;
  activityId?: string;
  selectedChart?: string;
  days?: number;
  area?: StorageAreaUsage['id'] | 'all';
} = $props();
let generation = 0;
let active = true;
const chart = $derived(chartHistory(snapshots, historyDays(days), area));

export async function refresh(capture = true) {
  const token = ++generation;
  loading = true;
  error = '';
  if (capture) activityId = '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      (async () => {
        if (capture) {
          const response: unknown = await chrome.runtime.sendMessage({
            type: MessageType.CAPTURE_STORAGE_HISTORY,
          });
          if (
            !response ||
            typeof response !== 'object' ||
            !('ok' in response) ||
            response.ok !== true
          ) {
            throw new Error(
              response &&
                typeof response === 'object' &&
                'error' in response &&
                typeof response.error === 'string'
                ? response.error
                : 'Could not save a measurement. Reload BCX in chrome://extensions and retry.',
            );
          }
          if (
            active &&
            token === generation &&
            'id' in response &&
            typeof response.id === 'string'
          )
            activityId = response.id;
        }
        return readStorageHistory();
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Storage history timed out. Please retry.')),
          10000,
        );
      }),
    ]);
    if (active && token === generation) snapshots = result;
  } catch (reason) {
    if (active && token === generation)
      error = getErrorMessage(reason, 'Could not load storage history.');
  } finally {
    clearTimeout(timer);
    if (active && token === generation) loading = false;
  }
}

onMount(() => {
  void refresh(false);
  const onChanged = (
    changes: Record<string, chrome.storage.StorageChange>,
    storageArea: string,
  ) => {
    if (storageArea === 'local' && STORAGE_HISTORY_KEY in changes && !loading)
      void refresh(false);
  };
  chrome.storage.onChanged.addListener(onChanged);
  return () => {
    active = false;
    generation++;
    chrome.storage.onChanged.removeListener(onChanged);
  };
});
</script>

<section class="storage-history" aria-label="Storage history" aria-busy={loading}>
  <Tabs.Root bind:value={selectedChart} class="bcx-panel-body">
    <BcxSectionTabs
      tabs={[{ id: 'total', label: 'Total storage size' }, { id: 'categories', label: 'Storage size by category' }, { id: 'entries', label: 'Stored entries' }]}
      bind:value={selectedChart}
      label="Storage history charts"
    />
  <div class="bcx-tab-content bcx-info-scroll">
  <div class="history-content">
  <p>Latest observation per local calendar day, retained for 365 days. Today updates as storage changes. Missing or failed measurements appear as gaps.</p>
  {#if error}<p role="alert">{error}</p>{/if}
  {#if chart.totals.some((point) => point.values !== null)}
    <Tabs.Content value="total">
      <BcxStorageHistoryChart title="Total storage size" points={chart.totals} labels={['Total size']} />
    </Tabs.Content>
    <Tabs.Content value="categories">
      <BcxStorageHistoryChart title="Storage size by category" points={chart.categories} labels={chart.labels} stacked />
    </Tabs.Content>
    <Tabs.Content value="entries">
      <BcxStorageHistoryChart title="Stored entries" points={chart.entries} labels={['Entries']} counts />
    </Tabs.Content>
    <p>Entries count storage keys, not releases inside lists. Session memory is temporary. Storage history includes its own size as observed before each snapshot is saved. Hover over a chart for daily values, or expand its measurement table.</p>
  {:else if !loading && !error}
    <p role="status">No measurements in this period yet. Select Refresh to record the first observation. Earlier days cannot be reconstructed.</p>
  {/if}
  </div>
  </div>
  </Tabs.Root>
</section>

<style>
  .storage-history { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; min-width: 0; overflow: hidden; }
  .history-content { padding: 0 12px 12px; }
  p { color: #9ca3af; line-height: 1.5; margin: 10px 0; }
  [role='alert'] { color: #fca5a5; }
</style>
