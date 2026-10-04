<script lang="ts">
import { X } from '@lucide/svelte';
import { TreeData } from 'src/features/treeview/TreeData';
import {
  TREE_ITEM_LAYOUT,
  type TreeItem,
} from 'src/features/treeview/TreeItem';
import BcxTreeBrowser from './BcxTreeBrowser.svelte';

let {
  root,
  id,
  onClose,
}: {
  root: TreeItem;
  id: string;
  onClose: () => void;
} = $props();
let treeData = $state<TreeData | null>(null);
let loading = $state(false);
let error = $state('');
let retry = $state(0);

$effect(() => {
  const currentRoot = root;
  retry;
  let cancelled = false;
  treeData = null;
  loading = true;
  error = '';
  void (async () => {
    try {
      const loaded =
        currentRoot.loadChildren && !currentRoot.childrenLoaded
          ? await currentRoot.loadChildren()
          : currentRoot;
      if (cancelled) return;
      const data = new TreeData([], TREE_ITEM_LAYOUT.BROWSER);
      data.add({
        ...currentRoot,
        ...(Array.isArray(loaded) ? { children: loaded } : loaded),
        childrenLoaded: true,
        loadChildren: undefined,
      });
      treeData = data;
    } catch {
      if (!cancelled)
        error = `Could not load ${currentRoot.label?.toLowerCase() ?? 'items'}. Please try again.`;
    } finally {
      if (!cancelled) loading = false;
    }
  })();
  return () => {
    cancelled = true;
  };
});
</script>

<section {id} class="release-tree-panel" aria-labelledby={`${id}-heading`}>
  <header>
    <h4 id={`${id}-heading`}>{root.label}</h4>
    <button type="button" class="bcx-section-tab" title={`Close ${root.label?.toLowerCase() ?? 'panel'}`} aria-label={`Close ${root.label?.toLowerCase() ?? 'panel'}`} onclick={onClose}><X size={16} aria-hidden="true" /></button>
  </header>
  {#if loading}<p role="status">Loading {root.label?.toLowerCase()}…</p>{/if}
  {#if error}
    <div class="panel-error"><p role="alert">{error}</p><button type="button" class="bcx-section-tab" onclick={() => { retry += 1; }}>Retry</button></div>
  {/if}
  {#if treeData}
    <BcxTreeBrowser {treeData} initialRootPath="0" lockInitialRoot={true} showBreadcrumb={false} nativeTabNavigation={true} />
  {/if}
</section>

<style>
.release-tree-panel { display: flex; flex: 0 0 auto; flex-direction: column; gap: 0.5rem; min-height: 0; height: clamp(14rem, 40vh, 28rem); margin: 0 0.5rem 0.5rem; padding: 0.5rem; border: 1px solid #4b5563; border-radius: 0.5rem; background: rgb(17 24 39 / 60%); }
header { display: flex; flex-shrink: 0; align-items: center; justify-content: space-between; gap: 0.5rem; }
h4 { margin: 0; color: #e5e7eb; font-size: 0.875rem; font-weight: 500; }
p { margin: 0; color: #9ca3af; font-size: 0.8125rem; }
.panel-error { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
[role='alert'] { color: #fca5a5; }
</style>
