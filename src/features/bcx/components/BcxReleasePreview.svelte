<script lang="ts">
import type { ReleasePreview } from 'src/features/treeview/ReleasePreview';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import type { Snippet } from 'svelte';
import BcxReleaseDetails from './BcxReleaseDetails.svelte';

let {
  item,
  onPreview,
  leadingActions,
}: {
  item: TreeItem;
  onPreview?: (item: TreeItem, trigger: HTMLElement) => void;
  leadingActions?: Snippet;
} = $props();
let preview = $state<ReleasePreview | null>(null);
let loading = $state(false);
let error = $state('');
let information = $derived(preview?.information ?? item.previewInformation);

$effect(() => {
  const currentItem = item;
  let cancelled = false;
  preview = null;
  error = '';
  loading = !!currentItem.loadPreview;
  if (currentItem.loadPreview) {
    void currentItem
      .loadPreview()
      .then((value) => {
        if (!cancelled) preview = value;
      })
      .catch((reason: unknown) => {
        if (!cancelled)
          error =
            reason instanceof Error ? reason.message : 'Failed to load release';
      })
      .finally(() => {
        if (!cancelled) loading = false;
      });
  }
  return () => {
    cancelled = true;
  };
});
</script>

<div class="release-preview">
  {#if information}
    <BcxReleaseDetails {item} {information} {preview} {loading} {error} {onPreview} {leadingActions} />
  {:else}
    {#if leadingActions}<div class="release-leading-actions">{@render leadingActions()}</div>{/if}
    {#if loading}
      <p role="status">Loading release details…</p>
    {:else if error}
      <p role="alert">{error}</p>
    {/if}
  {/if}
</div>

<style>
.release-preview { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; overflow: hidden; }
.release-leading-actions { padding: 4px var(--bcx-preview-gutter, 16px); }
p { margin: 0; padding: 0.5rem 1rem; font-size: 0.8125rem; }
[role='alert'] { color: #fca5a5; }
</style>
