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
  <header class="release-header">
    {#if selectedItem?.previewImage}
      {#key selectedItem.previewImage}
        <img
          class="release-cover"
          src={selectedItem.previewImage}
          alt={`Cover art for ${selectedItem.label ?? 'selected release'}`}
          onerror={(event) => { event.currentTarget.setAttribute('hidden', ''); }}
        />
      {/key}
    {/if}
    <h3>{selectedItem?.label ?? 'Release details'}</h3>
  </header>
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
.release-header { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 1rem; flex-shrink: 0; }
.release-cover { width: 6rem; height: 6rem; object-fit: contain; border-radius: 0.25rem; flex-shrink: 0; }
h3 { margin: 0; min-width: 0; overflow-wrap: anywhere; font-size: 0.875rem; }
p { padding: 0.5rem 1rem; font-size: 0.875rem; color: #d1d5db; }
</style>
