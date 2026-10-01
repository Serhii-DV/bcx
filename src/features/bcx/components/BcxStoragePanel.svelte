<script lang="ts">
import {
  formatStorageBytes,
  readStorageUsage,
  type StorageUsage,
} from 'src/features/bcx/storageUsage';
import { getErrorMessage } from 'src/utils/getErrorMessage';
import { onMount } from 'svelte';

let usage = $state<StorageUsage>();
let loading = $state(false);
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
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      readStorageUsage(),
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

<section class="storage-panel" aria-label="Extension storage" aria-busy={loading}>
  <div class="storage-heading">
    <h2>Storage</h2>
    <button onclick={refresh} disabled={loading}>{loading ? 'Measuring…' : 'Refresh'}</button>
  </div>
  {#if error}<p role="alert">{error}</p>{/if}
  {#if usage}
    <div class="storage-total" role="status">
      <span>{incomplete ? 'Total measured storage (partial)' : 'Total measured storage'}</span>
      <strong>{measuredAreas.length ? formatStorageBytes(total) : 'Unavailable'}</strong>
    </div>
    <p class="storage-note">Last measured: <time datetime={usage.measuredAt.toISOString()}>{usage.measuredAt.toLocaleString()}</time></p>
    {#each usage.areas as area (area.id)}
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
    {/each}
    <p class="storage-note">Sizes are reported by Chrome for extension storage, including temporary session memory. They exclude extension installation files, browser history, and page storage. History is read from Chrome; any cached catalogs are counted above.</p>
    <p class="storage-note">Entries count storage keys, not individual releases inside saved lists. Data can change during measurement. Refresh to update. KB = 1,024 bytes.</p>
  {:else if loading}
    <p role="status">Measuring extension storage…</p>
  {/if}
</section>

<style>
  .storage-panel { padding: 12px; color: #d1d5db; font-size: 0.8125rem; }
  .storage-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  h2, h3 { margin: 0; color: #f3f4f6; font-weight: 700; }
  h2 { font-size: 1rem; }
  h3 { font-size: 0.875rem; }
  button { border: 1px solid #4b5563; border-radius: 4px; padding: 4px 8px; cursor: pointer; color: #f3f4f6; }
  button:disabled { cursor: wait; opacity: 0.6; }
  button:focus-visible { outline: 2px solid #04b1fe; outline-offset: 2px; }
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
