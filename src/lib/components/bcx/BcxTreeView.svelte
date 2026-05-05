<script lang="ts">
import type { TreeData } from 'src/app/treeview/TreeData';
import type { TreeItem } from 'src/app/treeview/TreeItem';
import { isNode, isNodeExpanded } from 'src/app/treeview/utils';
import { onDestroy, onMount } from 'svelte';
import { musicFilterStore } from '$lib/stores/musicFilter';
import BcxTreeRenderer from './BcxTreeRenderer.svelte';
import BcxTreeViewFilter from './BcxTreeViewFilter.svelte';
import {
  activateTreeItem,
  collapseTreeNodeElement,
  createVisibleTreeData,
  expandTreeNode,
  findFirstVisibleChildByPath as findFirstVisibleChildInItemsByPath,
  findVisibleItem as findVisibleItemByIndex,
  findVisibleParentByPath as findVisibleParentInItemsByPath,
  focusTreeItemElement,
  getNavigableTreeItems,
  visibleItemIndex as getVisibleItemIndex,
  visibleNext as getVisibleNext,
  visiblePrev as getVisiblePrev,
  shouldIgnoreTreeKeyDown,
  showTreeItemActionFeedback,
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
const feedbackTimers = new Map<string, number>();

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
  feedbackTimers.forEach((timer) => clearTimeout(timer));
  feedbackTimers.clear();
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
    showItemFeedback,
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
  return getNavigableTreeItems(
    treeData.visible,
    debouncedFilterQuery,
    visiblePaths,
  );
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
  return findVisibleParentInItemsByPath(getNavigableItems(), path);
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

function showItemFeedback(
  item: TreeItem,
  message: string,
  duration: number = 1600,
) {
  showTreeItemActionFeedback(
    treeContainer,
    item,
    message,
    feedbackTimers,
    duration,
  );
}

async function expandNode(item: TreeItem) {
  await expandTreeNode({
    item,
    container: treeContainer,
    focusTreeItem,
    refreshTreeRendering,
    showItemFeedback,
  });
}

function handleFilterArrowDown() {
  focusTreeItem(getNavigableItems()[0]);
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

<div class="flex flex-col h-full gap-2">
  <BcxTreeViewFilter
    bind:this={filterRef}
    bind:value={filterQuery}
    suggestions={filterSuggestions}
    onArrowDown={handleFilterArrowDown}
  />
  <div
    bind:this={treeContainer}
    class="bcx-tree-view"
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
        <BcxTreeRenderer
          items={treeData.items}
          {focusedPath}
          filterQuery={debouncedFilterQuery}
          {visiblePaths}
          {visibleChildCounts}
          onItemClick={handleItemClick}
          onNodeClick={handleNodeClick}
        />
      {/key}
    {/if}
  </div>
</div>

<style>
.bcx-tree-view {
  flex: 1 1 0%;
  overflow-x: hidden;
  overflow-y: auto;
}
</style>
