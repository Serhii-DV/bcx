<script lang="ts">
import type { TreeData } from 'src/app/treeview/TreeData';
import type { TreeItem } from 'src/app/treeview/TreeItem';
import type { TreeItemButton } from 'src/app/treeview/TreeItemButton';
import { isNode, isNodeExpanded } from 'src/app/treeview/utils';
import { onDestroy, onMount } from 'svelte';
import { musicFilterStore } from '$lib/stores/musicFilter';

interface Props {
  treeData: TreeData;
}

let { treeData }: Props = $props();
let treeContainer: HTMLDivElement;
let filterInput: HTMLInputElement;
let focusedPath: string | null = $state(null);
let searchQuery = $state('');
let filterQuery = $state('');
let debouncedFilterQuery = $state('');
let storeUnsubscribe: (() => void) | null = null;
let filterDebounceTimer: number | null = null;

// Derived values
let effectiveTreeData: TreeData = $derived(
  treeData.filter(debouncedFilterQuery),
);

let visibleData = $derived.by(() => {
  const paths = new Set<string>();
  const childCounts = new Map<string, number>();

  // First pass: collect all visible paths from filtered tree
  function collectPaths(items: TreeItem[] | undefined) {
    if (!items) return;
    for (const item of items) {
      if (item.path) paths.add(item.path);
      if (item.children) collectPaths(item.children);
    }
  }
  collectPaths(effectiveTreeData.items);

  // Second pass: count visible children for each parent in original tree
  function countVisibleChildren(items: TreeItem[] | undefined) {
    if (!items) return;
    for (const item of items) {
      if (item.children && item.children.length > 0) {
        const visibleCount = item.children.filter((child) =>
          paths.has(child.path || ''),
        ).length;
        if (item.path) {
          childCounts.set(item.path, visibleCount);
        }
        countVisibleChildren(item.children);
      }
    }
  }
  countVisibleChildren(treeData.items);

  return { paths, childCounts };
});

let visiblePaths = $derived(visibleData.paths);
let visibleChildCounts = $derived(visibleData.childCounts);

// Expose method to parent component
export function focusFirstItem() {
  focusTreeItem(effectiveTreeData.visibleFirst);
}

// Reactive values - Debounce filter input
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

function handleItemClick(
  item?: TreeItem | null,
  event?: MouseEvent | KeyboardEvent,
) {
  if (!item) return;

  console.log('[BcxTreeView]', '[handleItemClick]', item, event);

  focusedPath = item.path ?? null;

  if (item.onClick) {
    item.onClick(event?.currentTarget as HTMLElement);
    return;
  }

  if (item.query) {
    musicFilterStore.setSearchQuery(item.query);
    return;
  }

  if (item.href) {
    // Prevent default navigation for music items and set the search query instead
    if (event?.currentTarget instanceof HTMLAnchorElement) {
      event?.preventDefault();
    }

    // Handle default navigation for non-music pages (e.g., open in new tab)
    // For keyboard events, manually navigate since we can't rely on default browser behavior
    if (event instanceof KeyboardEvent || event instanceof MouseEvent) {
      window.open(item.href, '_self');
    }
    return;
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (!treeContainer) return;

  // Allow system shortcuts to pass through
  if (event.ctrlKey || event.metaKey) {
    // Allow CTRL+R (or CMD+R on Mac) to reload the page
    if (event.key === 'r' || event.key === 'R') {
      return;
    }
  }

  event.preventDefault();

  const currentIndex = effectiveTreeData.visibleIndex(focusedPath ?? '');
  const pageSize = 20; // Number of items to jump for PageUp/PageDown

  switch (event.key) {
    case 'ArrowDown':
      focusTreeItem(effectiveTreeData.visibleNext(currentIndex));
      break;

    case 'ArrowUp':
      // If on first item, focus back to filter input
      if (currentIndex <= 0) {
        filterInput?.focus();
        break;
      }
      focusTreeItem(effectiveTreeData.visiblePrev(currentIndex));
      break;

    case 'ArrowRight':
      if (currentIndex >= 0) {
        const currentItem = effectiveTreeData.findVisible(currentIndex);

        if (!currentItem) {
          break;
        }

        if (!isNodeExpanded(currentItem)) {
          expandNode(currentItem);
        } else {
          // Move to first child
          focusTreeItem(effectiveTreeData.findFirstChildByPath(focusedPath));
        }
      }
      break;

    case 'ArrowLeft':
      if (currentIndex >= 0) {
        const currentItem = effectiveTreeData.findVisible(currentIndex);

        if (!currentItem) {
          break;
        }

        if (isNodeExpanded(currentItem)) {
          collapseNode(currentItem);
        } else {
          // Move to parent
          focusTreeItem(effectiveTreeData.findParentByPath(currentItem.path));
        }
      }
      break;

    case 'Enter':
      if (currentIndex >= 0) {
        const currentItem = effectiveTreeData.findVisible(currentIndex);

        if (!currentItem) {
          break;
        }

        if (isNode(currentItem) && !currentItem.href) {
          if (isNodeExpanded(currentItem)) {
            collapseNode(currentItem);
          } else {
            expandNode(currentItem);
          }
        } else {
          handleItemClick(currentItem, event);
        }
      }
      break;

    case ' ':
      handleItemClick(effectiveTreeData.findVisible(currentIndex), event);
      break;

    case 'Home':
      focusTreeItem(effectiveTreeData.visibleFirst);
      break;

    case 'End':
      focusTreeItem(effectiveTreeData.visibleLast);
      break;

    case 'PageDown': {
      focusTreeItem(effectiveTreeData.visibleNext(currentIndex, pageSize));
      break;
    }

    case 'PageUp': {
      focusTreeItem(effectiveTreeData.visiblePrev(currentIndex, pageSize));
      break;
    }
  }
}

function elementByPath(path?: string): HTMLElement | null {
  if (!path || !treeContainer) return null;
  return treeContainer.querySelector(`[data-path="${path}"]`) as HTMLElement;
}

function focusTreeItem(item?: TreeItem | null) {
  if (!item || !item.path) {
    return;
  }

  const element = elementByPath(item.path);

  if (!element) {
    return;
  }

  focusedPath = item.path;

  if (element instanceof HTMLDetailsElement) {
    element.querySelector('summary')?.focus();
  } else {
    element.focus();
  }
}

function collapseNode(item: TreeItem) {
  if (!isNode(item)) {
    return;
  }

  const element = elementByPath(item.path);

  if (element instanceof HTMLDetailsElement) {
    item.open = false;
    element.open = false;
  }
}

function expandNode(item: TreeItem) {
  if (!isNode(item)) {
    return;
  }

  const element = elementByPath(item.path);

  if (element instanceof HTMLDetailsElement) {
    item.open = true;
    element.open = true;
  }
}

function handleFilterKeyDown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    focusTreeItem(effectiveTreeData.visibleFirst);
  }
}

function isItemVisible(item: TreeItem): boolean {
  if (!debouncedFilterQuery.trim()) return true;
  return visiblePaths.has(item.path || '');
}

function getItemVisibleChildCount(item: TreeItem): number {
  if (!debouncedFilterQuery.trim()) {
    return item.children?.length || 0;
  }
  return visibleChildCounts.get(item.path || '') || 0;
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
  {@const Icon = item.icon}
  {#if Icon}
  <span class="item-icon text-gray-300"><Icon size="16" /></span>
  {/if}
{/snippet}

{#snippet treeItem(item: TreeItem)}
  {@const hasChildren = item.children && item.children.length > 0}
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

{#snippet treeItems(items: TreeItem[] | undefined)}
  {#if items && items.length > 0}
    <ol class="ml-0 mt-0 border-l border-gray-500/50 pl-2">
      {#each items as item}
        <li class:hidden={!isItemVisible(item)}>
          {#if item.children && item.children.length > 0}
            <details
              open={item.open}
              class="group"
              data-level="{item.level}"
              data-path="{item.path}"
              ontoggle={(e) => {
                item.open = e.currentTarget.open;
              }}
            >
              <summary
                class="tree-item cursor-pointer select-none px-0 hover:bg-white/10 transition-colors focus:bg-white/20 focus:ring-2 focus:ring-blue-400"
                class:focused={focusedPath === item.path}
                tabindex={focusedPath === item.path ? 0 : -1}
                onclick={(e) => handleItemClick(item, e)}
              >
                {@render treeItem(item)}
              </summary>
              {@render treeItems(item.children)}
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
  <div class="relative w-full flex items-center">
    <input
      bind:this={filterInput}
      id="bcx-tree-view-filter"
      type="text"
      placeholder="Filter items..."
      bind:value={filterQuery}
      onkeydown={handleFilterKeyDown}
      list="bcx-tree-view-filter-datalist"
      class="px-3 py-2 bg-gray-700 text-white text-sm opacity-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full {filterQuery ? 'pr-8' : ''}"
    />
    {#if filterQuery}
      <button
        type="button"
        aria-label="Clear filter"
        class="absolute right-2 top-1/4 -translate-y-1/2 text-gray-400 hover:text-white bg-transparent p-0 m-0 flex items-center justify-center cursor-pointer"
        onclick={() => { filterQuery = ''; filterInput?.focus(); }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    {/if}
  </div>
  <datalist id="bcx-tree-view-filter-datalist">
    {#each treeData.keywords as keyword}
      <option value="{keyword}"></option>
    {/each}
  </datalist>
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
      {@render treeItems(treeData.items)}
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
</style>
