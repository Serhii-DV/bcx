<script lang="ts">
import { TreeData } from 'src/features/treeview/TreeData';
import {
  TREE_ITEM_LAYOUT,
  type TreeItem,
} from 'src/features/treeview/TreeItem';
import { type Snippet, tick } from 'svelte';
import BcxSectionSort from './BcxSectionSort.svelte';
import BcxTreeBrowser from './BcxTreeBrowser.svelte';
import type { SectionNavigationItem } from './sectionNavigation';

let {
  root,
  onPreview,
  itemActions,
}: {
  root: TreeItem;
  onPreview?: (item: TreeItem, trigger: HTMLElement) => void;
  itemActions?: Snippet<[TreeItem]>;
} = $props();
let treeData = $state<TreeData | null>(null);
let loading = $state(false);
let error = $state('');
let retry = $state(0);
let container = $state<HTMLDivElement | null>(null);
let artistSort = $state<'az' | 'za'>('az');
const isArtistsPanel = $derived(root.pathKey === 'artists');
const artistSortItem = $derived<SectionNavigationItem>({
  id: root.path ?? 'artists',
  label: 'Artists',
  contentId: '',
  sortLabel: 'Sort artists by name',
  sortValue: artistSort,
  sortOptions: [
    { id: 'az', label: 'A–Z', title: 'Show artists in alphabetical order.' },
    {
      id: 'za',
      label: 'Z–A',
      title: 'Show artists in reverse alphabetical order.',
    },
  ],
});
const displayedTreeData = $derived.by(() => {
  if (!treeData || !isArtistsPanel) return treeData;
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
  });
  return new TreeData(
    treeData.items.map((item) => ({
      ...item,
      children: [...(item.children ?? [])].sort(
        (a, b) =>
          collator.compare(a.label ?? '', b.label ?? '') *
          (artistSort === 'za' ? -1 : 1),
      ),
    })),
    treeData.layout,
  );
});

function setArtistSort(id: string) {
  if (id === 'az' || id === 'za') artistSort = id;
}

async function handleSortCloseAutoFocus(event: Event) {
  event.preventDefault();
  await tick();
  if (!container?.closest('[hidden]'))
    container
      ?.querySelector<HTMLButtonElement>('[data-bcx-section-sort]')
      ?.focus();
}

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

{#snippet artistSortControls()}
  <BcxSectionSort item={artistSortItem} onValueChange={setArtistSort} onCloseAutoFocus={handleSortCloseAutoFocus} />
{/snippet}

<div bind:this={container} class="release-tree-panel">
  {#if loading}<p role="status">Loading {root.label?.toLowerCase()}…</p>{/if}
  {#if error}
    <div class="panel-error"><p role="alert">{error}</p><button type="button" class="bcx-section-tab" onclick={() => { retry += 1; }}>Retry</button></div>
  {/if}
  {#if displayedTreeData}
    <BcxTreeBrowser treeData={displayedTreeData} {onPreview} {itemActions} filterActions={isArtistsPanel ? artistSortControls : undefined} initialRootPath={displayedTreeData.items[0]?.path} lockInitialRoot={true} showBreadcrumb={false} nativeTabNavigation={true} />
  {/if}
</div>

<style>
.release-tree-panel { display: flex; flex: 1 1 0%; flex-direction: column; gap: 0.5rem; min-height: 0; }
p { margin: 0; color: #9ca3af; font-size: 0.8125rem; }
.panel-error { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
[role='alert'] { color: #fca5a5; }
</style>
