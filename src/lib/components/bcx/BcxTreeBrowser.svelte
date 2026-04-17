<script lang="ts">
import type { TreeData } from 'src/app/treeview/TreeData';
import type { TreeItem } from 'src/app/treeview/TreeItem';
import {
  findItemByPath,
  hydrateTreeItemChildren,
  isNode,
} from 'src/app/treeview/utils';
import {
  ICON_CHEVRON_RIGHT,
  ICON_CORNER_RIGHT_UP,
} from 'src/app/treeview/utils/icon';
import { onDestroy, onMount, tick } from 'svelte';
import { musicFilterStore } from '$lib/stores/musicFilter';
import BcxTreeBreadcrumb from './BcxTreeBreadcrumb.svelte';
import BcxTreeBrowserFilter from './BcxTreeBrowserFilter.svelte';
import BcxTreeItem from './BcxTreeItem.svelte';
import {
  activateTreeItem,
  filterTreeItemsFlat,
  findVisibleItem as findVisibleItemByIndex,
  focusTreeItemElement,
  getTreeItemFilterSuggestions,
  visibleItemIndex as getVisibleItemIndex,
  visibleNext as getVisibleNext,
  visiblePrev as getVisiblePrev,
  shouldIgnoreTreeKeyDown,
  waitForLoadingStatePaint,
} from './treeViewHelpers';

interface Props {
  treeData: TreeData;
}

const DRILL_UP_PATH = '__bcx_tree_drill_up__';

let { treeData }: Props = $props();
let treeContainer: HTMLDivElement;
let filterRef: BcxTreeBrowserFilter;
let focusedPath: string | null = $state(null);
let searchQuery = $state('');
let filterQuery = $state('');
let debouncedFilterQuery = $state('');
let currentRootPath: string | null = $state(null);
let treeVersion = $state(0);
let storeUnsubscribe: (() => void) | null = null;
let filterDebounceTimer: number | null = null;

let currentRootItem = $derived.by(() => {
  treeVersion;
  return currentRootPath ? findTreeItemByPath(currentRootPath) : null;
});
let currentLevelItems = $derived.by(() => {
  treeVersion;
  return currentRootItem?.children || treeData.items;
});
let breadcrumbItems = $derived.by(() => {
  treeVersion;
  return currentRootPath ? buildBreadcrumb(currentRootPath) : [];
});
let browserItems = $derived.by(() => {
  treeVersion;
  return filterTreeItemsFlat(currentLevelItems, debouncedFilterQuery);
});
let filterSuggestions = $derived.by(() => {
  treeVersion;
  return getTreeItemFilterSuggestions(currentLevelItems);
});

export function focusFirstItem() {
  focusTreeItem(getNavigableItems()[0]);
}

$effect(() => {
  const currentQuery = filterQuery;

  if (filterDebounceTimer !== null) {
    clearTimeout(filterDebounceTimer);
  }

  if (!currentQuery.trim()) {
    debouncedFilterQuery = '';
    filterDebounceTimer = null;
  } else {
    filterDebounceTimer = window.setTimeout(() => {
      debouncedFilterQuery = currentQuery;
      filterDebounceTimer = null;
    }, 300);
  }
});

$effect(() => {
  if (!debouncedFilterQuery.trim()) {
    focusedPath = null;
  }
});

$effect(() => {
  treeVersion;
  if (currentRootPath && !findTreeItemByPath(currentRootPath)) {
    currentRootPath = null;
  }
});

onMount(() => {
  storeUnsubscribe = musicFilterStore.subscribe((state) => {
    console.log('[BcxTreeBrowser]', '[setSearchQuery]', 'Subscribe', state);
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
    findItemByPath: findTreeItemByPath,
    findParentByPath: findParentTreeItemByPath,
    refreshTreeRendering,
    logLabel: '[BcxTreeBrowser]',
  });
}

async function handleKeyDown(event: KeyboardEvent) {
  if (!treeContainer) return;

  if (shouldIgnoreTreeKeyDown(event)) {
    return;
  }

  event.preventDefault();

  const currentIndex = visibleItemIndex(focusedPath);
  const pageSize = 20;

  switch (event.key) {
    case 'ArrowDown':
      focusTreeItem(visibleNext(currentIndex));
      break;

    case 'ArrowUp':
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

        await handleBrowserItemClick(currentItem, event);
      }
      break;

    case 'ArrowLeft':
      navigateToParentLevel();
      break;

    case 'Enter':
    case ' ':
      if (currentIndex >= 0) {
        const currentItem = findVisibleItem(currentIndex);

        if (!currentItem) {
          break;
        }

        await handleBrowserItemClick(currentItem, event);
      }
      break;

    case 'Home':
      focusTreeItem(getNavigableItems()[0]);
      break;

    case 'End':
      focusTreeItem(getNavigableItems().at(-1));
      break;

    case 'PageDown':
      focusTreeItem(visibleNext(currentIndex, pageSize));
      break;

    case 'PageUp':
      focusTreeItem(visiblePrev(currentIndex, pageSize));
      break;
  }
}

function getNavigableItems(): TreeItem[] {
  return currentRootPath
    ? [createDrillUpItem(), ...browserItems]
    : browserItems;
}

function visibleItemIndex(path?: string | null): number {
  return getVisibleItemIndex(getNavigableItems(), path);
}

function findVisibleItem(index: number): TreeItem | null {
  return findVisibleItemByIndex(getNavigableItems(), index);
}

function findNavigableItemByPath(path?: string | null): TreeItem | null {
  if (!path) {
    return null;
  }

  return getNavigableItems().find((item) => item.path === path) || null;
}

function visibleNext(index: number, step: number = 1): TreeItem | null {
  return getVisibleNext(getNavigableItems(), index, step);
}

function visiblePrev(index: number, step: number = 1): TreeItem | null {
  return getVisiblePrev(getNavigableItems(), index, step);
}

function focusTreeItem(item?: TreeItem | null) {
  if (!item || !item.path) {
    return;
  }

  focusedPath = item.path;
  focusTreeItemElement(treeContainer, item);
}

function refreshTreeRendering() {
  treeVersion += 1;
}

function findTreeItemByPath(path?: string | null): TreeItem | null {
  if (!path) return null;
  return findItemByPath(treeData.items, path);
}

function findParentTreeItemByPath(path?: string | null): TreeItem | null {
  if (!path) return null;
  const parentPath = path.split('.').slice(0, -1).join('.');
  return parentPath ? findTreeItemByPath(parentPath) : null;
}

function buildBreadcrumb(path: string): TreeItem[] {
  const pathParts = path.split('.');
  const items: TreeItem[] = [];

  for (let index = 0; index < pathParts.length; index += 1) {
    const pathAtLevel = pathParts.slice(0, index + 1).join('.');
    const item = findTreeItemByPath(pathAtLevel);

    if (item) {
      items.push(item);
    }
  }

  return items;
}

function createDrillUpItem(): TreeItem {
  return {
    label: '..',
    actionIcon: ICON_CORNER_RIGHT_UP,
    path: DRILL_UP_PATH,
    level: currentRootItem?.level || 0,
  };
}

function getDrillUpLabel(): string {
  const parentItem = findParentTreeItemByPath(currentRootPath);
  return parentItem ? `Back to ${parentItem.label}` : 'Back to root';
}

function isDrillUpItem(item: TreeItem): boolean {
  return item.path === DRILL_UP_PATH;
}

function navigateToLevel(path: string | null, focusPath?: string | null) {
  applyFilterImmediately();
  currentRootPath = path;
  focusedPath = null;
  refreshTreeRendering();
  tick().then(() => {
    focusTreeItem(findNavigableItemByPath(focusPath) || getNavigableItems()[0]);
  });
}

function navigateToParentLevel() {
  if (!currentRootPath) {
    return;
  }

  const previousRootPath = currentRootPath;
  const parentItem = findParentTreeItemByPath(currentRootPath);
  navigateToLevel(parentItem?.path || null, previousRootPath);
}

function applyFilterImmediately() {
  if (filterDebounceTimer !== null) {
    clearTimeout(filterDebounceTimer);
    filterDebounceTimer = null;
  }

  debouncedFilterQuery = filterQuery;
}

async function enterBrowserItem(item: TreeItem) {
  if (!isNode(item) || !item.path) {
    await handleItemClick(item);
    return;
  }

  const itemToEnter = item;
  const itemPath = item.path;

  if (item.loadChildren && !item.childrenLoaded) {
    item.isLoadingChildren = true;
    refreshTreeRendering();
    await waitForLoadingStatePaint(itemToEnter, focusTreeItem);
    await hydrateTreeItemChildren(item, true);
    refreshTreeRendering();
    await tick();
  }

  navigateToLevel(itemPath);
}

async function handleBrowserItemClick(
  item: TreeItem,
  event?: MouseEvent | KeyboardEvent,
) {
  if (isDrillUpItem(item)) {
    navigateToParentLevel();
    return;
  }

  if (isNode(item)) {
    await enterBrowserItem(item);
    return;
  }

  await handleItemClick(item, event);
}

function handleFilterArrowDown() {
  focusTreeItem(getNavigableItems()[0]);
}

function getItemVisibleChildCount(item: TreeItem): number {
  if (item.showChildrenCount === false) {
    return 0;
  }

  return item.childrenCount ?? item.children?.length ?? 0;
}

function withBrowserChildCount(item: TreeItem): TreeItem {
  return {
    ...item,
    childrenCount: getItemVisibleChildCount(item),
  };
}

function withBrowserTreeItemState(item: TreeItem): TreeItem {
  return {
    ...withBrowserChildCount(item),
    actionIcon: ICON_CHEVRON_RIGHT,
  };
}
</script>

{#snippet backTreeItem(item: TreeItem)}
  <div
    role="button"
    class="tree-item bcx-browser-row flex items-center w-full cursor-pointer pl-2 text-left px-0 py-0 text-gray-200 hover:bg-white/10 transition-colors focus:bg-white/20 focus:ring-2 focus:ring-blue-400"
    class:focused={focusedPath === item.path}
    data-level="{item.level}"
    data-path="{item.path}"
    tabindex={focusedPath === item.path ? 0 : -1}
    title={getDrillUpLabel()}
    aria-label={getDrillUpLabel()}
    onclick={(e) => handleBrowserItemClick(item, e)}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        handleBrowserItemClick(item, e);
      }
    }}
  >
    <BcxTreeItem item={item} />
  </div>
{/snippet}

{#snippet browserTreeItem(item: TreeItem)}
  {@const hasChildren = isNode(item)}
  {#if hasChildren}
    <div
      role="button"
      class="tree-item bcx-browser-row flex items-center w-full cursor-pointer pl-2 text-left px-0 py-0 text-gray-200 hover:bg-white/10 transition-colors focus:bg-white/20 focus:ring-2 focus:ring-blue-400"
      class:focused={focusedPath === item.path}
      data-level="{item.level}"
      data-path="{item.path}"
      tabindex={focusedPath === item.path ? 0 : -1}
      onclick={(e) => handleBrowserItemClick(item, e)}
      onkeydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          handleBrowserItemClick(item, e);
        }
      }}
    >
      <BcxTreeItem
        item={withBrowserTreeItemState(item)}
        showActions={!item.isLoadingChildren}
      />
      {#if item.isLoadingChildren}
        <span class="ml-auto pr-2 text-sm text-gray-400">Loading...</span>
      {/if}
    </div>
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
      <BcxTreeItem item={withBrowserChildCount(item)} />
    </a>
  {/if}
{/snippet}

{#snippet browserTreeItems(items: TreeItem[] | undefined)}
  <ol class="ml-0 mt-0 pl-0">
    {#if currentRootPath}
      <li>
        {@render backTreeItem(createDrillUpItem())}
      </li>
    {/if}
    {#if items && items.length > 0}
      {#each items as item}
        <li>
          {@render browserTreeItem(item)}
        </li>
      {/each}
    {:else}
      <li class="text-gray-400 text-sm text-center py-4">
        {debouncedFilterQuery.trim() ? 'No items match your filter' : 'No items here'}
      </li>
    {/if}
  </ol>
{/snippet}

<div class="flex flex-col h-full gap-2">
  <BcxTreeBrowserFilter
    bind:this={filterRef}
    bind:value={filterQuery}
    suggestions={filterSuggestions}
    onArrowDown={handleFilterArrowDown}
  />
  <BcxTreeBreadcrumb
    items={breadcrumbItems}
    currentPath={currentRootPath}
    onNavigate={navigateToLevel}
  />
  <div
    bind:this={treeContainer}
    class="bcx-tree-view pr-2 py-2 flex-1 overflow-y-auto"
    role="tree"
    tabindex="0"
    onkeydown={handleKeyDown}
    onfocus={() => {
      if (!focusedPath && browserItems.length > 0) {
        focusTreeItem(getNavigableItems()[0]);
      }
    }}
  >
    {#key treeVersion}
      {@render browserTreeItems(browserItems)}
    {/key}
  </div>
</div>

<style>
.bcx-tree-view a {
    display: inline-flex;
    padding-block: .25rem;
    vertical-align: middle;
}

.bcx-browser-row {
  border-radius: 4px;
}

</style>
