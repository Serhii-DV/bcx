<script lang="ts">
import { Compass, History, Pin } from '@lucide/svelte';
import type { PinnedPage } from 'src/features/bcx/pinnedNavigation';
import { pinnedPageDestination } from 'src/features/bcx/pinnedNavigation';
import { pinnedPageFromItem } from 'src/features/bcx/pinnedPage';
import {
  pinnedNavigation,
  refreshPinnedNavigation,
} from 'src/features/bcx/stores/pinnedNavigation';
import { HistoryTreeItem } from 'src/features/treeview/items/HistoryTreeItem';
import { getErrorMessage } from 'src/utils/getErrorMessage';
import { onMount } from 'svelte';
import BcxReturnPage from './BcxReturnPage.svelte';

let { errorMessage = '' }: { errorMessage?: string } = $props();
let recent = $state<{ page: PinnedPage; visitTime?: string }[]>([]);
let loading = $state(true);
let historyError = $state('');
let generation = 0;

async function loadRecentPages() {
  const request = ++generation;
  loading = true;
  historyError = '';
  try {
    const items = await HistoryTreeItem.createRecentMusicPages();
    if (request !== generation) return;
    recent = items.flatMap((item) => {
      const page = pinnedPageFromItem(item);
      return page ? [{ page, visitTime: item.timestamp?.dateTime }] : [];
    });
  } catch (reason) {
    if (request !== generation) return;
    historyError = getErrorMessage(
      reason,
      'Could not load recently visited pages.',
    );
  } finally {
    if (request === generation) loading = false;
  }
}

onMount(() => {
  void loadRecentPages();
  const history = chrome.history;
  const visited = (item: chrome.history.HistoryItem) => {
    if (item.url && pinnedPageDestination(item.url)) void loadRecentPages();
  };
  const removed = () => {
    void loadRecentPages();
  };
  history?.onVisited.addListener(visited);
  history?.onVisitRemoved.addListener(removed);
  return () => {
    generation++;
    history?.onVisited.removeListener(visited);
    history?.onVisitRemoved.removeListener(removed);
  };
});
</script>

<div class="dashboard">
  <p class="description">Return to your music.</p>
  {#if errorMessage}<p class="error" role="alert">{errorMessage}</p>{/if}
  <section aria-labelledby="return-pins-heading">
    <h2 id="return-pins-heading"><Pin size={16} aria-hidden="true" />Pinned <span class="count">{$pinnedNavigation.items.length}</span></h2>
    {#if $pinnedNavigation.error}
      <p class="error" role="alert">{$pinnedNavigation.error} <button type="button" onclick={() => void refreshPinnedNavigation()}>Retry</button></p>
    {/if}
    {#if $pinnedNavigation.items.length}
      <ul>{#each $pinnedNavigation.items as page (page.id)}<BcxReturnPage {page} />{/each}</ul>
    {:else if $pinnedNavigation.loading}
      <p class="empty" role="status">Loading pinned pages...</p>
    {:else if !$pinnedNavigation.error}
      <p class="empty">Pin bands and releases to keep them close.</p>
    {/if}
  </section>
  <section aria-labelledby="return-history-heading" aria-busy={loading}>
    <h2 id="return-history-heading"><History size={16} aria-hidden="true" />Recently visited <span class="count">{recent.length}</span></h2>
    {#if historyError}
      <p class="error" role="alert">{historyError} <button type="button" onclick={() => void loadRecentPages()}>Retry</button></p>
    {/if}
    {#if recent.length}
      <ul>{#each recent as { page, visitTime } (page.url)}<BcxReturnPage {page} {visitTime} />{/each}</ul>
    {:else if loading}
      <p class="empty" role="status">Loading recently visited pages...</p>
    {:else if !historyError}
      <p class="empty">Your recently visited Bandcamp pages will appear here.</p>
    {/if}
  </section>
  {#if !$pinnedNavigation.loading && !loading && !$pinnedNavigation.error && !historyError && !$pinnedNavigation.items.length && !recent.length}
    <a class="explore" href="https://bandcamp.com/discover" target="_blank" rel="noopener noreferrer"><Compass size={16} aria-hidden="true" />Explore Bandcamp</a>
  {/if}
</div>

<style>
  .dashboard { box-sizing: border-box; padding: 0 16px 16px; color: #f9fafb; }
  .description { margin: 0 0 24px; color: #9ca3af; font-size: 0.875rem; }
  section { margin-bottom: 24px; }
  h2 { display: flex; align-items: center; gap: 8px; margin: 0 0 8px; font-size: 0.875rem; font-weight: 600; }
  .count { padding: 1px 6px; border-radius: 4px; background: rgb(255 255 255 / 8%); color: #9ca3af; font-size: 0.6875rem; }
  ul { list-style: none; margin: 0; padding: 0; }
  .empty { margin: 0; color: #9ca3af; font-size: 0.875rem; line-height: 1.5; }
  .error { color: #fca5a5; font-size: 0.875rem; line-height: 1.5; }
  button { padding: 2px 6px; border: 0; border-radius: 4px; background: rgb(255 255 255 / 8%); color: inherit; cursor: pointer; }
  .explore { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid rgb(255 255 255 / 15%); border-radius: 6px; color: #f9fafb; font-size: 0.875rem; text-decoration: none; }
  .explore:hover, button:hover { background: rgb(255 255 255 / 10%); }
  .explore:focus-visible, button:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }
</style>
