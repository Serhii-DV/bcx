<script lang="ts">
import type { TreeData } from 'src/features/treeview/TreeData';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import BcxTreeBrowser from './BcxTreeBrowser.svelte';

let { treeData, rootPath }: { treeData: TreeData; rootPath: string } = $props();
let selectedItem: TreeItem | null = $state(null);
let preview: TreeData | null = $state(null);
let error = $state('');
let loading = $state(false);

function selectItem(item: TreeItem | null) {
  selectedItem = item?.loadPreview ? item : null;
}

$effect(() => {
  const item = selectedItem;
  let cancelled = false;
  preview = null;
  error = '';
  loading = !!item?.loadPreview;
  if (item?.loadPreview) {
    item
      .loadPreview()
      .then((data) => {
        if (!cancelled) preview = data;
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

<div class="release-list">
  <BcxTreeBrowser {treeData} initialRootPath={rootPath} lockInitialRoot={true} showBreadcrumb={false} initialSelectedHref={treeData.items.find((item) => item.path === rootPath)?.initialSelectedHref} onSelect={selectItem} nativeTabNavigation={true} />
</div>
<section class="release-preview" aria-label="Selected release details">
  <h3>{selectedItem?.label ?? 'Release details'}</h3>
  {#if error}
    <p role="alert">{error}</p>
  {:else if loading}
    <p role="status">Loading release details…</p>
  {:else if preview}
    {#key preview}
      <BcxTreeBrowser treeData={preview} nativeTabNavigation={true} showBreadcrumb={false} showFilter={false} />
    {/key}
  {:else}
    <p>Select a release to view its details.</p>
  {/if}
</section>

<style>
.release-list { display: flex; flex-direction: column; flex: 1 1 55%; min-height: 0; overflow: hidden; }
.release-preview { display: flex; flex-direction: column; flex: 1 1 45%; min-height: 0; overflow: hidden; border-top: 1px solid #4b5563; }
h3 { margin: 0; padding: 0.5rem 1rem; font-size: 0.875rem; flex-shrink: 0; }
p { padding: 0.5rem 1rem; font-size: 0.875rem; color: #d1d5db; }
</style>
