<script lang="ts">
import type { TreeData } from 'src/app/treeview/TreeData';
import type { TreeItem } from 'src/app/treeview/TreeItem';
import type { TreeItemButton } from 'src/app/treeview/TreeItemButton';
import {
  findItemByPath,
  hydrateTreeItemChildren,
  isNode,
  isNodeExpanded,
} from 'src/app/treeview/utils';
import { makeIcon } from 'src/app/treeview/utils/icon';
import { onDestroy, onMount, tick } from 'svelte';
import { musicFilterStore } from '$lib/stores/musicFilter';
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
  waitForLoadingStatePaint,
} from './treeViewHelpers';

interface Props {
  treeData: TreeData;
}

const DRILL_UP_PATH = '__bcx_tree_drill_up__';

let { treeData }: Props = $props();
let treeContainer: HTMLDivElement;
let filterRef: BcxTreeViewFilter;
let focusedPath: string | null = $state(null);
let searchQuery = $state('');
let filterQuery = $state('');
let debouncedFilterQuery = $state('');
let currentRootPath: string | null = $state(null);
let treeVersion = $state(0);
let storeUnsubscribe: (() => void) | null = null;
let filterDebounceTimer: number | null = null;

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
let isBrowsingActive = $derived(!debouncedFilterQuery.trim());
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

export function focusFirstItem() {
  focusTreeItem(getNavigableItems()[0] || effectiveTreeData.visibleFirst);
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

        if (isBrowsingActive) {
          await handleBrowserItemClick(currentItem, event);
          break;
        }

        if (!isNodeExpanded(currentItem)) {
          expandNode(currentItem);
        } else {
          focusTreeItem(findFirstVisibleChildByPath(focusedPath));
        }
      }
      break;

    case 'ArrowLeft':
      if (isBrowsingActive) {
        navigateToParentLevel();
        break;
      }

      if (currentIndex >= 0) {
        const currentItem = findVisibleItem(currentIndex);

        if (!currentItem) {
          break;
        }

        if (isNodeExpanded(currentItem)) {
          collapseNode(currentItem);
        } else {
          focusTreeItem(findVisibleParentByPath(currentItem.path));
        }
      }
      break;

    case 'Enter':
    case ' ':
      if (currentIndex >= 0) {
        const currentItem = findVisibleItem(currentIndex);

        if (!currentItem) {
          break;
        }

        if (isBrowsingActive) {
          await handleBrowserItemClick(currentItem, event);
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

    case 'PageDown':
      focusTreeItem(visibleNext(currentIndex, pageSize));
      break;

    case 'PageUp':
      focusTreeItem(visiblePrev(currentIndex, pageSize));
      break;
  }
}

function getNavigableItems(): TreeItem[] {
  if (isBrowsingActive) {
    return currentRootPath
      ? [createDrillUpItem(), ...currentLevelItems]
      : currentLevelItems;
  }

  return treeData.visible.filter((item) => visiblePaths.has(item.path || ''));
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
  return parentPath ? findTreeItemByPath(parentPath) : null;
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
  const parentItem = findParentTreeItemByPath(currentRootPath);

  return {
    label: parentItem ? `Back to ${parentItem.label}` : 'Back to root',
    path: DRILL_UP_PATH,
    level: currentRootItem?.level || 0,
  };
}

function isDrillUpItem(item: TreeItem): boolean {
  return item.path === DRILL_UP_PATH;
}

function navigateToLevel(path: string | null) {
  currentRootPath = path;
  focusedPath = null;
  refreshTreeRendering();
  tick().then(() => {
    focusTreeItem(getNavigableItems()[0]);
  });
}

function navigateToParentLevel() {
  if (!currentRootPath) {
    return;
  }

  const parentItem = findParentTreeItemByPath(currentRootPath);
  navigateToLevel(parentItem?.path || null);
}

async function expandNode(item: TreeItem) {
  await expandTreeNode({
    item,
    container: treeContainer,
    focusTreeItem,
    refreshTreeRendering,
  });
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

function isItemVisible(item: TreeItem): boolean {
  if (!debouncedFilterQuery.trim()) return true;
  return visiblePaths.has(item.path || '');
}

function getItemVisibleChildCount(item: TreeItem): number {
  return getVisibleChildCount(item, debouncedFilterQuery, visibleChildCounts);
}

function handleFilterNodeClick(item: TreeItem, event: MouseEvent) {
  event.preventDefault();
  focusedPath = item.path ?? null;

  if (isNodeExpanded(item)) {
    collapseNode(item);
    return;
  }

  expandNode(item);
}
</script>

{#snippet treeItemButton(button: TreeItemButton)}
  {@const Icon = button.icon}
  {#if button.href}
    <a
      href={button.href}
      title={button.title}
      class="item-button inline-flex items-center justify-center p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
      onclick={(e) => {
        e.stopPropagation();
        if (button.onClick) {
          e.preventDefault();
          button.onClick(e.currentTarget as HTMLElement);
        }
      }}
    >
      <Icon size="16" />
    </a>
  {:else}
    <button
      type="button"
      title={button.title}
      class="item-button cursor-pointer inline-flex items-center justify-center p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
      onclick={(e) => {
        e.stopPropagation();
        if (button.onClick) {
          button.onClick(e.currentTarget as HTMLElement);
        }
      }}
    >
      <Icon size="16" />
    </button>
  {/if}
{/snippet}

{#snippet treeItemButtons(item: TreeItem)}
  {#if item.buttons && item.buttons.length > 0}
<div class="item-buttons">
  {#each item.buttons as button}
    {@render treeItemButton(button)}
  {/each}
</div>
  {/if}
{/snippet}

{#snippet treeItemIcon(item: TreeItem)}
  {@const Icon = makeIcon(item.icon)}
  {#if Icon}
  <span class="item-icon text-gray-300"><Icon size="16" /></span>
  {/if}
{/snippet}

{#snippet treeItem(item: TreeItem)}
  {@const hasChildren = isNode(item)}
  {@render treeItemImage(item)}
  <span class="item-label" class:ml-2={!hasChildren}>{item.label}</span>
  {@render treeItemActions(item)}
{/snippet}

{#snippet treeItemActions(item: TreeItem)}
  {@const visibleChildCount = getItemVisibleChildCount(item)}
<div class="item-actions ml-auto flex gap-1 flex-shrink-0" role="presentation">
  {@render treeItemIcon(item)}
  {@render treeItemButtons(item)}
  {#if visibleChildCount > 0}
    <span class="item-count text-sm text-gray-400">{visibleChildCount}</span>
  {/if}
</div>
{/snippet}

{#snippet treeItemImage(item: TreeItem)}
  {#if item.image}
    <img src="{item.image}" alt="{item.label}" class="bcx-tree-item-img w-6 h-6 flex-shrink-0" loading="lazy" />
  {/if}
{/snippet}

{#snippet breadcrumb()}
  {#if isBrowsingActive}
    <nav class="bcx-tree-breadcrumb" aria-label="Tree location">
      <button
        type="button"
        class:current={!currentRootPath}
        onclick={() => navigateToLevel(null)}
      >
        Root
      </button>
      {#each breadcrumbItems as item}
        <span aria-hidden="true">/</span>
        <button
          type="button"
          class:current={item.path === currentRootPath}
          onclick={() => navigateToLevel(item.path || null)}
        >
          {item.label}
        </button>
      {/each}
    </nav>
  {/if}
{/snippet}

{#snippet backTreeItem(item: TreeItem)}
  <button
    type="button"
    class="tree-item bcx-browser-row flex items-center w-full cursor-pointer pl-2 text-left px-0 py-0 text-gray-200 hover:bg-white/10 transition-colors focus:bg-white/20 focus:ring-2 focus:ring-blue-400"
    class:focused={focusedPath === item.path}
    data-level="{item.level}"
    data-path="{item.path}"
    tabindex={focusedPath === item.path ? 0 : -1}
    onclick={(e) => handleBrowserItemClick(item, e)}
  >
    <span class="bcx-browser-arrow" aria-hidden="true">&lsaquo;</span>
    <span class="item-label">{item.label}</span>
  </button>
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
      {@render treeItemImage(item)}
      <span class="item-label">{item.label}</span>
      {#if item.isLoadingChildren}
        <span class="ml-auto pr-2 text-sm text-gray-400">Loading...</span>
      {:else}
        {@render treeItemActions(item)}
        <span class="bcx-browser-arrow" aria-hidden="true">&rsaquo;</span>
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
      {@render treeItem(item)}
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
      <li class="text-gray-400 text-sm text-center py-4">No items here</li>
    {/if}
  </ol>
{/snippet}

{#snippet filteredTreeItems(items: TreeItem[] | undefined)}
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
                onclick={(e) => handleFilterNodeClick(item, e)}
              >
                {@render treeItem(item)}
              </summary>
              {#if item.isLoadingChildren}
                <div class="pl-6 py-1 text-sm text-gray-400">Loading...</div>
              {:else}
                {@render filteredTreeItems(item.children)}
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
              {@render treeItem(item)}
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
  {@render breadcrumb()}
  <div
    bind:this={treeContainer}
    class="bcx-tree-view pr-2 py-2 flex-1 overflow-y-auto"
    role="tree"
    tabindex="0"
    onkeydown={handleKeyDown}
    onfocus={() => {
      if (!focusedPath && effectiveTreeData.items) {
        focusTreeItem(getNavigableItems()[0] || effectiveTreeData.visibleFirst);
      }
    }}
  >
    {#if debouncedFilterQuery.trim() && visiblePaths.size === 0}
      <div class="text-gray-400 text-sm text-center py-4">
        No items match your filter
      </div>
    {:else if isBrowsingActive}
      {#key treeVersion}
        {@render browserTreeItems(currentLevelItems)}
      {/key}
    {:else if treeData.items}
      {#key treeVersion}
        {@render filteredTreeItems(treeData.items)}
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

.bcx-tree-view a, .bcx-tree-view span:not(.highlight-container) {
    display: inline-flex;
    padding-block: .25rem;
    vertical-align: middle;
}

.bcx-tree-view .bcx-tree-item-img {
    margin-top: 0.125rem;
}

.bcx-tree-view details > summary > .bcx-tree-item-img {
    margin-right: 0.5rem;
}

.bcx-tree-view .hidden {
    display: none;
}

.bcx-tree-view .item-actions {
  padding-right: 5px;
}

.bcx-tree-view .item-icon {
  margin-left: 5px;
}

.bcx-tree-view .item-icon,
.bcx-tree-view .item-buttons {
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.bcx-tree-view .tree-item:hover .item-icon,
.bcx-tree-view .tree-item:focus .item-icon,
.bcx-tree-view .tree-item.focused .item-icon,
.bcx-tree-view .tree-item:hover .item-buttons,
.bcx-tree-view .tree-item:focus .item-buttons,
.bcx-tree-view .tree-item.focused .item-buttons {
    opacity: 1;
}

.bcx-tree-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  padding-inline: 0.5rem;
  font-size: 0.75rem;
  color: rgb(209 213 219);
}

.bcx-tree-breadcrumb button {
  border-radius: 4px;
  padding: 0.125rem 0.25rem;
  color: inherit;
  cursor: pointer;
}

.bcx-tree-breadcrumb button:hover,
.bcx-tree-breadcrumb button:focus {
  background-color: rgb(255 255 255 / 10%);
  outline: none;
}

.bcx-tree-breadcrumb button.current {
  color: white;
}

.bcx-browser-row {
  border-radius: 4px;
}

.bcx-browser-arrow {
  display: inline-flex;
  flex-shrink: 0;
  justify-content: center;
  min-width: 1.25rem;
  padding-inline: 0.25rem;
  color: rgb(156 163 175);
}
</style>
