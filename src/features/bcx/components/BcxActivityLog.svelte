<script lang="ts">
import { MessageType } from 'src/core/message';
import { copyToClipboard } from 'src/utils/clipboard';
import { getErrorMessage } from 'src/utils/getErrorMessage';
import { onMount } from 'svelte';
import {
  ACTIVITY_LOG_KEY,
  ACTIVITY_PROCESSES,
  ACTIVITY_RETENTION_MS,
  ACTIVITY_STATUSES,
  type ActivityOperation,
  type ActivityProcess,
  type ActivityStatus,
  activityProcessLabels,
  activityStatusLabels,
  readActivityLog,
} from '../activityLog';

let {
  process = $bindable('all'),
  operationId = $bindable(''),
}: {
  process?: ActivityProcess | 'all';
  operationId?: string;
} = $props();
let operations = $state<ActivityOperation[]>([]);
let status = $state<ActivityStatus | 'all'>('all');
let showAutomatic = $state(false);
let error = $state('');
let notice = $state('');
let loading = $state(true);
let clearing = $state(false);
let now = $state(Date.now());
let generation = 0;
const visible = $derived(
  operations.filter(
    (operation) =>
      operation.startedAt >= now - ACTIVITY_RETENTION_MS &&
      (!operationId || operation.id === operationId) &&
      (process === 'all' || operation.process === process) &&
      (status === 'all' || operation.status === status) &&
      (operationId ||
        showAutomatic ||
        !operation.automatic ||
        operation.status === 'warning' ||
        operation.status === 'failed'),
  ),
);
async function refresh() {
  const token = ++generation;
  try {
    const result = await readActivityLog();
    if (token === generation) {
      operations = result;
      error = '';
    }
  } catch (reason) {
    if (token === generation)
      error = getErrorMessage(reason, 'Could not read activity log.');
  } finally {
    if (token === generation) loading = false;
  }
}
onMount(() => {
  void refresh();
  const changed = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ) => {
    if (area === 'local' && ACTIVITY_LOG_KEY in changes) void refresh();
  };
  chrome.storage.onChanged.addListener(changed);
  const timer = setInterval(() => {
    now = Date.now();
  }, 1000);
  return () => {
    generation++;
    clearInterval(timer);
    chrome.storage.onChanged.removeListener(changed);
  };
});
function duration(operation: ActivityOperation): string {
  const elapsed = Math.max(
    0,
    (operation.finishedAt ?? now) - operation.startedAt,
  );
  return elapsed < 1000
    ? `${elapsed}ms`
    : elapsed < 60000
      ? `${(elapsed / 1000).toFixed(1)}s`
      : `${Math.floor(elapsed / 60000)}m ${Math.floor((elapsed % 60000) / 1000)}s`;
}
function exportText(): string {
  return JSON.stringify(
    { exportedAt: new Date().toISOString(), operations: visible },
    null,
    2,
  );
}
async function copy() {
  try {
    await copyToClipboard(exportText());
    notice = 'Visible operations copied.';
  } catch (reason) {
    error = getErrorMessage(reason, 'Could not copy log.');
  }
}
function download() {
  try {
    const url = URL.createObjectURL(
      new Blob([exportText()], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bcx-activity-log.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notice = 'Visible operations exported.';
  } catch (reason) {
    error = getErrorMessage(reason, 'Could not export log.');
  }
}
async function clear() {
  clearing = true;
  try {
    const response: unknown = await chrome.runtime.sendMessage({
      type: MessageType.CLEAR_ACTIVITY_LOG,
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
          : 'Could not clear activity log.',
      );
    }
    operationId = '';
    await refresh();
    notice =
      'Log cleared. Active processes continue; their cleared entries will not reappear.';
  } catch (reason) {
    error = getErrorMessage(reason, 'Could not clear activity log.');
  } finally {
    clearing = false;
  }
}
</script>

<section class="activity-panel bcx-info-scroll" aria-label="Activity log" aria-busy={loading}>
  <h2>Activity log</h2>
  <p>Recent extension processes. Kept locally for up to 7 days, 200 operations, or 256 KB. Each operation retains its latest 40 events.</p>
  <div class="controls">
    <label>Process <select bind:value={process} onchange={() => operationId = ''}><option value="all">All processes</option>{#each ACTIVITY_PROCESSES as value}<option value={value}>{activityProcessLabels[value]}</option>{/each}</select></label>
    <label>Outcome <select bind:value={status}><option value="all">All outcomes</option>{#each ACTIVITY_STATUSES as value}<option value={value}>{activityStatusLabels[value]}</option>{/each}</select></label>
    <label><input type="checkbox" bind:checked={showAutomatic} /> Show routine automatic activity</label>
  </div>
  <div class="controls">
    <button onclick={copy} disabled={!visible.length}>Copy visible</button>
    <button onclick={download} disabled={!visible.length}>Export visible</button>
    <button onclick={clear} disabled={clearing || loading}>{clearing ? 'Clearing…' : 'Clear log'}</button>
    {#if operationId}<button onclick={() => { operationId = ''; status = 'all'; }}>Show all runs</button>{/if}
  </div>
  {#if error}<p role="alert">{error}</p>{/if}
  <p role="status">{notice || `${visible.length} operations shown`}</p>
  {#each visible as operation (operation.id)}
    <details open={operation.id === operationId} class:attention={operation.status === 'failed' || operation.status === 'warning'}>
      <summary>
        <span class="title">{operation.title}</span>
        <span class="meta"><time datetime={new Date(operation.startedAt).toISOString()}>{new Date(operation.startedAt).toLocaleString()}</time> · {activityStatusLabels[operation.status]} · {duration(operation)}{operation.automatic ? ' · Automatic' : ''}</span>
        <span class="message">{operation.events.at(-1)?.message ?? 'Starting…'}</span>
      </summary>
      <ol>{#each operation.events as event}<li><time datetime={new Date(event.time).toISOString()}>{new Date(event.time).toLocaleTimeString()}</time> {event.message}</li>{/each}</ol>
    </details>
  {:else}
    {#if !loading && !error}<p>{operationId ? 'This operation is no longer in the retained log. Select Show all runs to see other activity.' : 'No activity matches these filters. Run a sync or refresh Storage to record an operation.'}</p>{/if}
  {/each}
</section>

<style>
  .activity-panel { flex: 1; min-height: 0; overflow: auto; padding: 16px; color: #d1d5db; font-size: 0.75rem; }
  h2 { color: #f9fafb; font-size: 0.875rem; font-weight: 700; }
  p { margin: 10px 0; color: #9ca3af; line-height: 1.5; }
  .controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 12px 0; }
  label { display: flex; align-items: center; gap: 5px; }
  button, select { padding: 6px 8px; border: 1px solid #4b5563; border-radius: 5px; background: #1f2937; color: #f3f4f6; }
  button, summary { cursor: pointer; }
  button:disabled { opacity: 0.5; cursor: default; }
  button:focus-visible, select:focus-visible, input:focus-visible, summary:focus-visible { outline: 2px solid #04b1fe; outline-offset: 2px; }
  details { margin: 8px 0; border: 1px solid #374151; border-radius: 6px; background: #111827; overflow-wrap: anywhere; }
  details.attention { border-color: #b45309; }
  summary { padding: 12px; }
  .title { font-weight: 600; color: #f9fafb; }
  .meta, .message { display: block; margin-top: 5px; line-height: 1.5; }
  .meta, li time { color: #9ca3af; font-variant-numeric: tabular-nums; }
  ol { margin: 0; padding: 0 12px 12px 30px; }
  li { margin-top: 8px; line-height: 1.5; }
  [role='alert'] { color: #fca5a5; }
</style>
