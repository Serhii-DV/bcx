<script lang="ts">
import { ArrowRight, Compass, History } from '@lucide/svelte';
import { pinnedPageDestination } from 'src/features/bcx/pinnedNavigation';
import { HistoryTreeItem } from 'src/features/treeview/items/HistoryTreeItem';
import { TreeData } from 'src/features/treeview/TreeData';
import { TREE_ITEM_LAYOUT } from 'src/features/treeview/TreeItem';
import { getErrorMessage } from 'src/utils/getErrorMessage';
import { onMount } from 'svelte';
import BcxTreeBrowser from './BcxTreeBrowser.svelte';

let {
  errorMessage = '',
  onViewHistory,
}: { errorMessage?: string; onViewHistory?: () => void } = $props();
let recent = $state(new TreeData([], TREE_ITEM_LAYOUT.BROWSER));
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
    const data = new TreeData([], TREE_ITEM_LAYOUT.BROWSER);
    for (const item of items) data.add(item);
    recent = data;
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
  {#if errorMessage}<p class="error" role="alert">{errorMessage}</p>{/if}
  <section aria-labelledby="return-history-heading" aria-busy={loading} class:has-recent={recent.items.length > 0}>
    <h2 id="return-history-heading"><History size={16} aria-hidden="true" />Recently visited <span class="count">{recent.items.length}</span></h2>
    {#if historyError}
      <p class="error" role="alert">{historyError} <button type="button" onclick={() => void loadRecentPages()}>Retry</button></p>
    {/if}
    {#if recent.items.length}
      <BcxTreeBrowser treeData={recent} showFilter={false} showBreadcrumb={false} nativeTabNavigation={true} />
    {:else if loading}
      <p class="empty" role="status">Loading recently visited pages...</p>
    {:else if !historyError}
      <p class="empty">Your recently visited Bandcamp pages will appear here.</p>
    {/if}
    {#if onViewHistory}
      <button type="button" class="view-history" onclick={onViewHistory}>View history <ArrowRight size={14} aria-hidden="true" /></button>
    {/if}
  </section>
  {#if !loading && !historyError && !recent.items.length}
    <a class="explore" href="https://bandcamp.com/discover" target="_blank" rel="noopener noreferrer"><Compass size={16} aria-hidden="true" />Explore Bandcamp</a>
  {/if}
</div>

<style>
  .dashboard { box-sizing: border-box; display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; padding: 0 16px 16px; color: #f9fafb; }
  section { display: flex; flex-shrink: 0; flex-direction: column; min-height: 0; min-width: 0; margin-bottom: 24px; }
  section.has-recent { flex: 1 1 0%; }
  h2 { display: flex; align-items: center; gap: 8px; margin: 0 0 8px; font-size: 0.875rem; font-weight: 600; }
  .count { padding: 1px 6px; border-radius: 4px; background: rgb(255 255 255 / 8%); color: #9ca3af; font-size: 0.6875rem; }
  .empty { margin: 0; color: #9ca3af; font-size: 0.875rem; line-height: 1.5; }
  .error { color: #fca5a5; font-size: 0.875rem; line-height: 1.5; }
  button { padding: 2px 6px; border: 0; border-radius: 4px; background: rgb(255 255 255 / 8%); color: inherit; cursor: pointer; }
  button.view-history { display: inline-flex; align-self: flex-start; flex-shrink: 0; align-items: center; gap: 6px; margin-top: 12px; padding: 4px 0; background: transparent; color: #d1d5db; font-size: 0.875rem; }
  button.view-history:hover { background: transparent; color: #f9fafb; text-decoration: underline; }
  .explore { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid rgb(255 255 255 / 15%); border-radius: 6px; color: #f9fafb; font-size: 0.875rem; text-decoration: none; }
  .explore:hover, button:hover { background: rgb(255 255 255 / 10%); }
  .explore:focus-visible, button:focus-visible { outline: 2px solid #38bdf8; outline-offset: 2px; }
</style>
