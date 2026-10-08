<script lang="ts">
import { openUrlInActiveTab } from 'src/core/extensionActions';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import { getErrorMessage } from 'src/utils/getErrorMessage';
import type { Snippet } from 'svelte';
import type { PinnedPage } from '../pinnedNavigation';
import { loadPinnedPage } from '../pinnedPage';
import BcxBandPreview from './BcxBandPreview.svelte';
import BcxPinButton from './BcxPinButton.svelte';
import BcxReleasePreview from './BcxReleasePreview.svelte';

let { page, leadingActions }: { page: PinnedPage; leadingActions?: Snippet } =
  $props();
let item = $state<TreeItem>();
let loading = $state(false);
let error = $state('');
let retry = $state(0);
$effect(() => {
  const selected = page;
  retry;
  let cancelled = false;
  loading = true;
  item = undefined;
  error = '';
  void loadPinnedPage(selected)
    .then((loaded) => {
      if (!cancelled) item = loaded;
    })
    .catch((reason) => {
      if (!cancelled)
        error = getErrorMessage(reason, 'Could not load saved page details.');
    })
    .finally(() => {
      if (!cancelled) loading = false;
    });
  return () => {
    cancelled = true;
  };
});

async function openPage(event: MouseEvent) {
  if (
    event.button !== 0 ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  event.preventDefault();
  try {
    if (!(await openUrlInActiveTab(page.url))) window.location.assign(page.url);
  } catch (reason) {
    error = getErrorMessage(reason, 'Could not open the Bandcamp page.');
  }
}
</script>

{#if item?.bandPreview}
  <BcxBandPreview band={item.bandPreview} {leadingActions} />
{:else if item}
  <BcxReleasePreview {item} {leadingActions} />
{:else}
  <div class="pinned-page-fallback">
    <div class="pinned-page-actions">{@render leadingActions?.()}<BcxPinButton {page} /></div>
    <h3>{page.title}</h3>
    {#if page.artistName}<p>{page.artistName}</p>{/if}
    {#if loading}<p role="status">Loading saved page details…</p>{:else}<p role="status">Saved details are unavailable. Open this page on Bandcamp to load its information.</p>{/if}
    {#if error}<p role="alert">{error}</p>{/if}
    <div class="pinned-page-actions">
      <a class="bcx-section-tab" href={page.url} onclick={(event) => void openPage(event)}>Open on Bandcamp</a>
      <button type="button" class="bcx-section-tab" disabled={loading} onclick={() => { retry++; }}>Retry</button>
    </div>
  </div>
{/if}

<style>
.pinned-page-fallback { padding: 8px var(--bcx-preview-gutter, 16px); font-size: 0.875rem; overflow-y: auto; }
.pinned-page-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
h3 { margin: 12px 0 4px; overflow-wrap: anywhere; }
p { margin: 8px 0; color: #9ca3af; }
[role='alert'] { color: #fca5a5; }
</style>
