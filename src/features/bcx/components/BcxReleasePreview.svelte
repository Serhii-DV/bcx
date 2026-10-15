<script lang="ts">
import { watchMusicLibrary } from 'src/bandcamp/domain/storage/musicLibrary';
import type { ReleasePreview } from 'src/features/treeview/ReleasePreview';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import type { Snippet } from 'svelte';
import BcxReleaseDetails from './BcxReleaseDetails.svelte';

let {
  item,
  onPreview,
  leadingActions,
  trailingActions,
}: {
  item: TreeItem;
  onPreview?: (item: TreeItem, trigger: HTMLElement) => void;
  leadingActions?: Snippet;
  trailingActions?: Snippet;
} = $props();
let preview = $state<ReleasePreview | null>(null);
let loading = $state(false);
let error = $state('');
let information = $derived(preview?.information ?? item.previewInformation);

let libraryRevision = $state(0);
$effect(() =>
  watchMusicLibrary(() => {
    libraryRevision += 1;
  }),
);

$effect(() => {
  libraryRevision;
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
    <BcxReleaseDetails {item} {information} {preview} {loading} {error} {onPreview} {leadingActions} {trailingActions} />
  {:else}
    {#if leadingActions || trailingActions}
      <div class="release-leading-actions">
        {@render leadingActions?.()}
        {#if trailingActions}<div class="release-trailing-actions">{@render trailingActions()}</div>{/if}
      </div>
    {/if}
    {#if loading}
      <p role="status">Loading release details…</p>
    {:else if error}
      <p role="alert">{error}</p>
    {/if}
  {/if}
</div>

<style>
.release-preview { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; overflow: hidden; }
.release-leading-actions { display: flex; align-items: flex-start; padding: 4px var(--bcx-preview-gutter, 16px); }
.release-trailing-actions { margin-left: auto; }
p { margin: 0; padding: 0.5rem 1rem; font-size: 0.8125rem; }
[role='alert'] { color: #fca5a5; }
</style>
