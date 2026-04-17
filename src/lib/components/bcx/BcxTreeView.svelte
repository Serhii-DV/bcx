<script lang="ts">
import type { TreeData } from 'src/app/treeview/TreeData';
import type { TreeItem } from 'src/app/treeview/TreeItem';
import { isNode, isNodeExpanded } from 'src/app/treeview/utils';
import { onDestroy, onMount } from 'svelte';
import { musicFilterStore } from '$lib/stores/musicFilter';
import BcxTreeItem from './BcxTreeItem.svelte';
import BcxTreeViewFilter from './BcxTreeViewFilter.svelte';
import {
  activateTreeItem,
  collapseTreeNodeElement,
  createVisibleTreeData,
  expandTreeNode,
  findFirstVisibleChildByPath as findFirstVisibleChildInItemsByPath,
  findVisibleItem as findVisibleItemByIndex,
  focusTreeItemElement,
  getItemVisibleChildCount as getVisibleChildCount,
  visibleItemIndex as getVisibleItemIndex,
  visibleNext as getVisibleNext,
  visiblePrev as getVisiblePrev,
  shouldIgnoreTreeKeyDown,
} from './treeViewHelpers';

interface Props {
  treeData: TreeData;
}

let { treeData }: Props = $props();
let treeContainer: HTMLDivElement;
let filterRef: BcxTreeViewFilter;
let focusedPath: string | null = $state(null);
let searchQuery = $state('');
let filterQuery = $state('');
let debouncedFilterQuery = $state('');
let treeVersion = $state(0);
let storeUnsubscribe: (() => void) | null = null;
let filterDebounceTimer: number | null = null;

// Derived values
let effectiveTreeData: TreeData = $derived.by(() => {
  treeVersion;
  return treeData.filter(debouncedFilterQuery);
});

let visibleData = $derived.by(() => {
  treeVersion;
  return createVisibleTreeData(effectiveTreeData.items, treeData.items);
});

let visiblePaths = $derived(visibleData.paths);
let visibleChildCounts = $derived(visibleData.childCounts);
let filterSuggestions = $derived.by(() => {
  treeVersion;
  return treeData.filterSuggestions;
});

// Expose method to parent component
export function focusFirstItem() {
  focusTreeItem(effectiveTreeData.visibleFirst);
}

$effect(() => {
  const currentQuery = filterQuery; // Capture current value synchronously

  // Clear existing timer
  if (filterDebounceTimer !== null) {
    clearTimeout(filterDebounceTimer);
  }

  // If filter is empty, update immediately without debounce
  if (!currentQuery.trim()) {
    debouncedFilterQuery = '';
    filterDebounceTimer = null;
  } else {
    // Set new timer for debounced update (only for non-empty queries)
    filterDebounceTimer = window.setTimeout(() => {
      debouncedFilterQuery = currentQuery;
      filterDebounceTimer = null;
    }, 300); // 300ms debounce delay
  }
});

// Reactive values - Reset focus when clearing filter
$effect(() => {
  if (!debouncedFilterQuery.trim()) {
    focusedPath = null;
  }
});

onMount(() => {
  // Subscribe to store updates
  storeUnsubscribe = musicFilterStore.subscribe((state) => {
    console.log('[BcxTreeView]', '[setSearchQuery]', 'Subscribe', state);
    if (state.searchQuery !== searchQuery) {
      searchQuery = state.searchQuery || '';
    }
  });
});

onDestroy(() => {
  if (storeUnsubscribe) {
    storeUnsubscribe();
  }
  if (filterDebounceTimer !== null) {
    clearTimeout(filterDebounceTimer);
  }
});

async function handleItemClick(
  item?: TreeItem | null,
  event?: MouseEvent | KeyboardEvent,
) {
  if (!item) return;

  focusedPath = item.path ?? null;
  await activateTreeItem({
    item,
    event,
    treeData,
    focusTreeItem,
    findItemByPath: (path) => treeData.findByPath(path),
    findParentByPath: (path) => treeData.findParentByPath(path),
    refreshTreeRendering,
    logLabel: '[BcxTreeView]',
  });
}

async function handleKeyDown(event: KeyboardEvent) {
  if (!treeContainer) return;

  if (shouldIgnoreTreeKeyDown(event)) {
    return;
  }

  event.preventDefault();

  const currentIndex = visibleItemIndex(focusedPath);
  const pageSize = 20; // Number of items to jump for PageUp/PageDown

  switch (event.key) {
    case 'ArrowDown':
      focusTreeItem(visibleNext(currentIndex));
      break;

    case 'ArrowUp':
      // If on first item, focus back to filter input
      if (currentIndex <= 0) {
        filterRef?.focus();
        break;
      }
      focusTreeItem(visiblePrev(currentIndex));
      break;

    case 'ArrowRight':
      if (currentIndex >= 0) {
        const currentItem = findVisibleItem(currentIndex);

        if (!currentItem) {
          break;
        }

        if (!isNodeExpanded(currentItem)) {
          expandNode(currentItem);
        } else {
          // Move to first child
          focusTreeItem(findFirstVisibleChildByPath(focusedPath));
        }
      }
      break;

    case 'ArrowLeft':
      if (currentIndex >= 0) {
        const currentItem = findVisibleItem(currentIndex);

        if (!currentItem) {
          break;
        }

        if (isNodeExpanded(currentItem)) {
          collapseNode(currentItem);
        } else {
          // Move to parent
          focusTreeItem(findVisibleParentByPath(currentItem.path));
        }
      }
      break;

    case 'Enter':
      if (currentIndex >= 0) {
        const currentItem = findVisibleItem(currentIndex);

        if (!currentItem) {
          break;
        }

        if (isNode(currentItem)) {
          if (isNodeExpanded(currentItem)) {
            collapseNode(currentItem);
          } else {
            expandNode(currentItem);
          }
        } else {
          await handleItemClick(currentItem, event);
        }
      }
      break;

    case ' ':
      if (currentIndex >= 0) {
        const currentItem = findVisibleItem(currentIndex);

        if (!currentItem) {
          break;
        }

        if (isNode(currentItem)) {
          if (isNodeExpanded(currentItem)) {
            collapseNode(currentItem);
          } else {
            expandNode(currentItem);
          }
        } else {
          await handleItemClick(currentItem, event);
        }
      }
      break;

    case 'Home':
      focusTreeItem(getNavigableItems()[0]);
      break;

    case 'End':
      focusTreeItem(getNavigableItems().at(-1));
      break;

    case 'PageDown': {
      focusTreeItem(visibleNext(currentIndex, pageSize));
      break;
    }

    case 'PageUp': {
      focusTreeItem(visiblePrev(currentIndex, pageSize));
      break;
    }
  }
}

function getNavigableItems(): TreeItem[] {
  const visibleItems = treeData.visible;

  if (!debouncedFilterQuery.trim()) {
    return visibleItems;
  }

  return visibleItems.filter((item) => visiblePaths.has(item.path || ''));
}

function visibleItemIndex(path?: string | null): number {
  return getVisibleItemIndex(getNavigableItems(), path);
}

function findVisibleItem(index: number): TreeItem | null {
  return findVisibleItemByIndex(getNavigableItems(), index);
}

function visibleNext(index: number, step: number = 1): TreeItem | null {
  return getVisibleNext(getNavigableItems(), index, step);
}

function visiblePrev(index: number, step: number = 1): TreeItem | null {
  return getVisiblePrev(getNavigableItems(), index, step);
}

function findVisibleParentByPath(path?: string | null): TreeItem | null {
  if (!path) return null;
  const parentPath = path.split('.').slice(0, -1).join('.');
  if (!parentPath) return null;
  return getNavigableItems().find((item) => item.path === parentPath) ?? null;
}

function findFirstVisibleChildByPath(path?: string | null): TreeItem | null {
  return findFirstVisibleChildInItemsByPath(getNavigableItems(), path);
}

function focusTreeItem(item?: TreeItem | null) {
  if (!item || !item.path) {
    return;
  }

  focusedPath = item.path;
  focusTreeItemElement(treeContainer, item);
}

function collapseNode(item: TreeItem) {
  collapseTreeNodeElement(treeContainer, item);
}

function refreshTreeRendering() {
  treeVersion += 1;
}

async function expandNode(item: TreeItem) {
  await expandTreeNode({
    item,
    container: treeContainer,
    focusTreeItem,
    refreshTreeRendering,
  });
}

function handleFilterArrowDown() {
  focusTreeItem(getNavigableItems()[0]);
}

function isItemVisible(item: TreeItem): boolean {
  if (!debouncedFilterQuery.trim()) return true;
  return visiblePaths.has(item.path || '');
}

function getItemVisibleChildCount(item: TreeItem): number {
  return getVisibleChildCount(item, debouncedFilterQuery, visibleChildCounts);
}

function handleNodeClick(item: TreeItem, event: MouseEvent) {
  event.preventDefault();
  focusedPath = item.path ?? null;

  if (isNodeExpanded(item)) {
    collapseNode(item);
    return;
  }

  expandNode(item);
}
</script>

{#snippet treeItems(items: TreeItem[] | undefined)}
  {#if items && items.length > 0}
    <ol class="ml-0 mt-0 border-l border-gray-500/50 pl-2">
      {#each items as item}
        <li class:hidden={!isItemVisible(item)}>
          {#if isNode(item)}
            <details
              open={item.open}
              class="group"
              data-level="{item.level}"
              data-path="{item.path}"
            >
              <summary
                class="tree-item cursor-pointer select-none px-0 hover:bg-white/10 transition-colors focus:bg-white/20 focus:ring-2 focus:ring-blue-400"
                class:focused={focusedPath === item.path}
                tabindex={focusedPath === item.path ? 0 : -1}
                onclick={(e) => handleNodeClick(item, e)}
              >
                <BcxTreeItem item={item} childCount={getItemVisibleChildCount(item)} />
              </summary>
              {#if item.isLoadingChildren}
                <div class="pl-6 py-1 text-sm text-gray-400">Loading...</div>
              {:else}
                {@render treeItems(item.children)}
              {/if}
            </details>
          {:else}
            <a
              class="tree-item flex items-center w-full cursor-pointer pl-2 text-left px-0 py-0 text-gray-200 hover:bg-white/10 transition-colors focus:bg-white/20 focus:ring-2 focus:ring-blue-400"
              class:focused={focusedPath === item.path}
              data-level="{item.level}"
              data-path="{item.path}"
              tabindex={focusedPath === item.path ? 0 : -1}
              onclick={(e) => handleItemClick(item, e)}
              href={item.href}
              title={item.href}
              >
              <BcxTreeItem item={item} childCount={getItemVisibleChildCount(item)} />
            </a>
          {/if}
        </li>
      {/each}
    </ol>
  {/if}
{/snippet}

<div class="flex flex-col h-full gap-2">
  <BcxTreeViewFilter
    bind:this={filterRef}
    bind:value={filterQuery}
    suggestions={filterSuggestions}
    onArrowDown={handleFilterArrowDown}
  />
  <div
    bind:this={treeContainer}
    class="bcx-tree-view pr-2 py-2 flex-1 overflow-y-auto"
    role="tree"
    tabindex="0"
    onkeydown={handleKeyDown}
    onfocus={() => {
      // Set initial focus to first item if none is focused
      if (!focusedPath && effectiveTreeData.items) {
        focusTreeItem(effectiveTreeData.visibleFirst);
      }
    }}
  >
    {#if debouncedFilterQuery.trim() && visiblePaths.size === 0}
      <div class="text-gray-400 text-sm text-center py-4">
        No items match your filter
      </div>
    {:else if treeData.items}
      {#key treeVersion}
        {@render treeItems(treeData.items)}
      {/key}
    {/if}
  </div>
</div>

<style>
:is([open]:is(.bcx-tree-view details) > summary)::before {
  transform: rotate(90deg);
}

:is(.bcx-tree-view details) summary {
  display: flex;
  align-items: center;
  cursor: pointer;
}

:is(:is(.bcx-tree-view details) summary)::before {
  display: inline-block;
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  margin: 0.25rem;
  content: "";
  background-color: currentcolor;
  -webkit-mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>');
          mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>');
  -webkit-mask-size: cover;
          mask-size: cover;
}

.bcx-tree-view a {
    display: inline-flex;
    padding-block: .25rem;
    vertical-align: middle;
}

.bcx-tree-view .hidden {
    display: none;
}
</style>
