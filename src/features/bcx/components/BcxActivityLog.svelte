<script lang="ts">
import { Info } from '@lucide/svelte';
import { MessageType } from 'src/core/message';
import { copyToClipboard } from 'src/utils/clipboard';
import { getErrorMessage } from 'src/utils/getErrorMessage';
import { onMount } from 'svelte';
import {
  ACTIVITY_LOG_KEY,
  ACTIVITY_MAX_BYTES,
  ACTIVITY_MAX_OPERATIONS,
  ACTIVITY_RETENTION_MS,
  type ActivityOperation,
  activityLines,
  readActivityLog,
} from '../activityLog';

const retentionId = $props.id();
let retentionTrigger = $state<HTMLButtonElement>();
let retentionPopover = $state<HTMLDivElement>();

function positionRetention() {
  if (!retentionTrigger || !retentionPopover) return;
  // Match the native keyword popover: measure before opening, then clamp to the viewport.
  retentionPopover.classList.add('retention-measuring');
  const width = retentionPopover.offsetWidth;
  const height = retentionPopover.offsetHeight;
  retentionPopover.classList.remove('retention-measuring');
  const trigger = retentionTrigger.getBoundingClientRect();
  const margin = 8;
  const viewport = document.documentElement;
  const below = trigger.bottom + margin;
  const top =
    below + height <= viewport.clientHeight - margin
      ? below
      : trigger.top - height - margin;
  retentionPopover.style.left = `${Math.max(margin, Math.min(trigger.left, viewport.clientWidth - width - margin))}px`;
  retentionPopover.style.top = `${Math.max(margin, Math.min(top, viewport.clientHeight - height - margin))}px`;
}
function repositionRetention() {
  if (retentionPopover?.matches(':popover-open')) positionRetention();
}
let operations = $state<ActivityOperation[]>([]);
let showAutomatic = $state(false);
let error = $state('');
let notice = $state('');
let loading = $state(true);
let clearing = $state(false);
let now = $state(Date.now());
let generation = 0;
const visible = $derived(
  activityLines(
    operations.filter(
      (operation) => operation.startedAt >= now - ACTIVITY_RETENTION_MS,
    ),
    showAutomatic,
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
  window.addEventListener('resize', repositionRetention);
  document.addEventListener('scroll', repositionRetention, true);
  const changed = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ) => {
    if (area === 'local' && ACTIVITY_LOG_KEY in changes) void refresh();
  };
  chrome.storage.onChanged.addListener(changed);
  const timer = setInterval(() => {
    now = Date.now();
  }, 60000);
  return () => {
    generation++;
    window.removeEventListener('resize', repositionRetention);
    document.removeEventListener('scroll', repositionRetention, true);
    clearInterval(timer);
    chrome.storage.onChanged.removeListener(changed);
  };
});
async function copy() {
  try {
    await copyToClipboard(
      visible
        .map(
          (line) =>
            `${new Date(line.time).toLocaleString()}  ${line.level === 'info' ? '' : `${line.level.toUpperCase()}: `}${line.message}`,
        )
        .join('\n'),
    );
    notice = 'Log copied.';
  } catch (reason) {
    error = getErrorMessage(reason, 'Could not copy log.');
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

<section class="activity-panel" aria-label="Activity log" aria-busy={loading}>
  <div class="controls">
    <button onclick={copy} disabled={!visible.length}>Copy</button>
    <button onclick={clear} disabled={clearing || loading}>{clearing ? 'Clearing…' : 'Clear'}</button>
    <button bind:this={retentionTrigger} type="button" popovertarget={retentionId} class="retention-trigger" aria-haspopup="dialog" aria-label="About activity log retention" title="How long activity logs are kept">
      <Info size={15} aria-hidden="true" />
    </button>
    <div bind:this={retentionPopover} id={retentionId} popover="auto" role="dialog" aria-label="Activity log retention" class="bcx-activity-retention" onbeforetoggle={(event) => { if (event.newState === 'open') positionRetention(); }}>
      <div class="retention-content">
        <h3>How long are logs kept?</h3>
        <p>Logs stay on this device for up to <strong>{ACTIVITY_RETENTION_MS / (24 * 60 * 60 * 1000)} days</strong>.</p>
        <p>Older logs disappear from this panel automatically and are deleted from storage when the next log is written.</p>
        <p>Logs are also limited to <strong>{ACTIVITY_MAX_OPERATIONS} process runs</strong> (such as syncs or storage checks) and <strong>{ACTIVITY_MAX_BYTES / 1024} KB</strong>. Older logs may be removed sooner when either limit is reached.</p>
        <p>Use Clear to remove logs at any time. Your saved Bandcamp data is unaffected.</p>
      </div>
    </div>
    <label><input type="checkbox" bind:checked={showAutomatic} /> Show automatic activity</label>
  </div>
  {#if error}<p role="alert">{error}</p>{/if}
  {#if notice}<p role="status">{notice}</p>{/if}
  <div class="log-scroll bcx-info-scroll">
    <ol aria-label="Recent activity">
      {#each visible as line (line.id)}
        <li class:warning={line.level === 'warning'} class:error={line.level === 'error'}>
          <time datetime={new Date(line.time).toISOString()} title={new Date(line.time).toLocaleString()}>{new Date(line.time).toLocaleTimeString()}</time>
          <span>{#if line.level === 'warning'}<span aria-label="Warning">⚠ </span>{:else if line.level === 'error'}<span>Error: </span>{/if}{line.message}</span>
        </li>
      {:else}
        <li class="empty">{loading ? 'Loading…' : 'No activity yet. Run a sync or refresh Storage to see its log.'}</li>
      {/each}
    </ol>
  </div>
</section>

<style>
  .activity-panel { display: flex; flex: 1; flex-direction: column; min-height: 0; min-width: 0; color: #d1d5db; font-size: 0.75rem; }
  .controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid #374151; }
  .retention-trigger { display: inline-flex; align-items: center; justify-content: center; min-width: 28px; min-height: 28px; color: #9ca3af; }
  .bcx-activity-retention { position: fixed; inset: auto; margin: 0; padding: 0; box-sizing: border-box; width: min(300px, calc(100vw - 24px)); max-height: calc(100vh - 16px); overflow: auto; border: 1px solid #4b5563; border-radius: 6px; background: #111827; color: #d1d5db; box-shadow: 0 8px 24px rgb(0 0 0 / 35%); }
  .bcx-activity-retention:focus-visible { outline: 2px solid #04b1fe; outline-offset: 2px; }
  .bcx-activity-retention:global(.retention-measuring) { display: block; visibility: hidden; }
  .retention-content { padding: 12px; font-size: 0.75rem; line-height: 1.5; }
  .retention-content h3 { margin: 0 0 8px; color: #f9fafb; font-size: inherit; font-weight: 600; }
  .retention-content p { margin: 8px 0 0; color: #d1d5db; }
  label { display: flex; align-items: center; gap: 5px; color: #9ca3af; }
  button { padding: 4px 8px; border: 1px solid #4b5563; border-radius: 4px; background: #1f2937; color: #f3f4f6; cursor: pointer; }
  button:disabled { opacity: 0.5; cursor: default; }
  button:focus-visible, input:focus-visible { outline: 2px solid #04b1fe; outline-offset: 2px; }
  p { margin: 8px 12px; color: #9ca3af; }
  .log-scroll { flex: 1; min-height: 0; overflow: auto; padding: 8px 12px; }
  ol { list-style: none; margin: 0; padding: 0; }
  li { display: flex; align-items: baseline; gap: 10px; padding: 4px 0; line-height: 1.5; overflow-wrap: anywhere; }
  li > span { min-width: 0; }
  time { flex-shrink: 0; color: #9ca3af; font-variant-numeric: tabular-nums; }
  .empty { color: #9ca3af; }
  .warning { color: #fcd34d; }
  .error, [role='alert'] { color: #fca5a5; }
</style>
