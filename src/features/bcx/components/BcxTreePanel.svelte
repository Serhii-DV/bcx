<script lang="ts">
import { TreeData } from 'src/features/treeview/TreeData';
import {
  TREE_ITEM_LAYOUT,
  type TreeItem,
} from 'src/features/treeview/TreeItem';
import type { Snippet } from 'svelte';
import BcxTreeBrowser from './BcxTreeBrowser.svelte';

let {
  root,
  leadingItem,
  onPreview,
  autoSelectPreview = true,
  itemActions,
  filterActions,
  showFilter = true,
  filterQuery = $bindable(null),
  compareChildren,
  doubleClickToExpand = true,
  onActivateNode,
  activeNodePath,
}: {
  root: TreeItem;
  leadingItem?: TreeItem;
  onPreview?: (item: TreeItem, trigger: HTMLElement) => void;
  autoSelectPreview?: boolean;
  itemActions?: Snippet<[TreeItem]>;
  filterActions?: Snippet;
  showFilter?: boolean;
  filterQuery?: string | null;
  compareChildren?: (a: TreeItem, b: TreeItem) => number;
  doubleClickToExpand?: boolean;
  onActivateNode?: (item: TreeItem) => void;
  activeNodePath?: string;
} = $props();
let treeData = $state<TreeData | null>(null);
let loading = $state(false);
let error = $state('');
let retry = $state(0);

const displayedTreeData = $derived.by(() => {
  if (!treeData || !compareChildren) return treeData;
  return new TreeData(
    treeData.items.map((item) => ({
      ...item,
      children: [...(item.children ?? [])].sort(compareChildren),
    })),
    treeData.layout,
  );
});

$effect(() => {
  const currentRoot = root;
  const firstItem = leadingItem;
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
      const loadedRoot = {
        ...currentRoot,
        ...(Array.isArray(loaded) ? { children: loaded } : loaded),
      };
      const data = new TreeData([], TREE_ITEM_LAYOUT.BROWSER);
      data.add({
        ...loadedRoot,
        children: firstItem
          ? [firstItem, ...(loadedRoot.children ?? [])]
          : loadedRoot.children,
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

<div class="tree-panel">
  {#if loading}<p role="status">Loading {root.label?.toLowerCase()}…</p>{/if}
  {#if error}
    <div class="panel-error"><p role="alert">{error}</p><button type="button" class="bcx-section-tab" onclick={() => { retry += 1; }}>Retry</button></div>
  {/if}
  {#if displayedTreeData}
    <BcxTreeBrowser treeData={displayedTreeData} {onPreview} {autoSelectPreview} {itemActions} {filterActions} {showFilter} {doubleClickToExpand} {onActivateNode} {activeNodePath} bind:filterQuery initialRootPath={displayedTreeData.items[0]?.path} lockInitialRoot={true} showBreadcrumb={false} nativeTabNavigation={true} />
  {/if}
</div>

<style>
.tree-panel { display: flex; flex: 1 1 0%; flex-direction: column; gap: 0.5rem; min-height: 0; min-width: 0; }
p { margin: 0; color: #9ca3af; font-size: 0.8125rem; }
.panel-error { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
[role='alert'] { color: #fca5a5; }
</style>
