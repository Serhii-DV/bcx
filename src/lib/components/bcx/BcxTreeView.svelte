<script lang="ts">
import { ExternalLink } from 'lucide-svelte';
import type { TreeData } from 'src/app/treeview/TreeData';
import { TreeData as TreeDataClass } from 'src/app/treeview/TreeData';
import type { TreeItem } from 'src/app/treeview/TreeItem';
import type { TreeItemButton } from 'src/app/treeview/TreeItemButton';
import {
  hasDescendantMatchingQuery,
  isNode,
  isNodeExpanded,
} from 'src/app/treeview/utils';
import { isBandcampMusicUrl } from 'src/bandcamp/domain/url/helper';
import { currentPageUrl } from 'src/core/shared';
import { Url } from 'src/core/url';
import { getExtensionUrl } from 'src/utils/chrome.runtime';
import { onDestroy, onMount } from 'svelte';
import { musicFilterStore } from '$lib/stores/musicFilter';

interface Props {
  treeData: TreeData;
  onItemClick?: (item: TreeItem, event?: MouseEvent | KeyboardEvent) => void;
}

let { treeData, onItemClick = () => {} }: Props = $props();
let treeContainer: HTMLDivElement;
let filterInput: HTMLInputElement;
let focusedPath: string | null = $state(null);
let searchQuery = $state('');
let filterQuery = $state('');
let debouncedFilterQuery = $state('');
let effectiveTreeData: TreeData = $state(treeData);
let storeUnsubscribe: (() => void) | null = null;
let filterDebounceTimer: number | null = null;

// Expose method to parent component
export function focusFirstItem() {
  focusTreeItem(effectiveTreeData.visibleFirst);
}

// Check if an item matches the filter query (case-insensitive)
function itemMatchesFilter(item: TreeItem, query: string): boolean {
  if (!query.trim()) return true;
  return item.label.toLowerCase().includes(query.toLowerCase());
}

// Check if an item or any of its descendants match the filter
function itemOrDescendantMatches(item: TreeItem, query: string): boolean {
  if (itemMatchesFilter(item, query)) {
    return true;
  }
  if (item.children && item.children.length > 0) {
    return item.children.some((child) => itemOrDescendantMatches(child, query));
  }
  return false;
}

// Create a deep filtered copy of tree data (independent from original)
function createFilteredTreeData(items: TreeItem[], query: string): TreeItem[] {
  return items
    .filter((item) => itemOrDescendantMatches(item, query))
    .map((item) => {
      // Create a deep copy to avoid mutating original tree
      const itemCopy: TreeItem = {
        ...item,
        children: item.children
          ? createFilteredTreeData(item.children, query)
          : undefined,
      };
      return itemCopy;
    });
}

// Get visible children count based on filter
function getVisibleChildrenCount(item: TreeItem, query: string): number {
  if (!item.children || item.children.length === 0) return 0;
  if (!query.trim()) {
    return item.children.length;
  }
  return item.children.filter((child) => itemOrDescendantMatches(child, query))
    .length;
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

// Reactive values - Update effective tree data based on debounced filter
$effect(() => {
  if (debouncedFilterQuery.trim()) {
    // Create filtered tree data
    const filteredItems = createFilteredTreeData(
      treeData.items,
      debouncedFilterQuery,
    );
    // Only update tree if we have matching items
    if (filteredItems.length > 0) {
      const filteredTreeData = new TreeDataClass(filteredItems);
      effectiveTreeData = filteredTreeData;
    } else {
      // No matches - create empty tree data
      effectiveTreeData = new TreeDataClass([]);
    }
  } else {
    // Use original tree data
    effectiveTreeData = treeData;
    // Reset focus when clearing filter
    focusedPath = null;
  }
});

// Reactive values - searchQuery effect
$effect(() => {
  if (searchQuery && searchQuery.trim() !== '') {
    console.log('[searchQuery]', '[BcxTreeView]', 'effect', searchQuery);
    // Expand all nodes that contain matching items
    effectiveTreeData.items.forEach((item) => {
      if (!isNode(item)) {
        return;
      }
      const hasMatchingDescendant = hasDescendantMatchingQuery(
        item,
        searchQuery,
      );
      console.log(
        '[searchQuery]',
        '[BcxTreeView]',
        'effect',
        'hasMatchingDescendant',
        item,
        hasMatchingDescendant,
      );
      if (hasMatchingDescendant && !item.open) {
        expandNode(item);
      }
    });
  } else {
    // Optional: Collapse all nodes when search is cleared
    // Uncomment if you want this behavior:
    // effectiveTreeData.items.forEach((item) => {
    //   if (isNode(item) && item.open) {
    //     collapseNode(item);
    //   }
    // });
  }
});

onMount(() => {
  // Subscribe to store updates
  storeUnsubscribe = musicFilterStore.subscribe((state) => {
    console.log('[setSearchQuery]', 'BcxTreeView subscribe', state);
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

  if (item.onClick) {
    item.onClick(elementByPath(item.path) as HTMLElement);
    return;
  }

  focusedPath = item.path ?? null;
  let handleDefaultClick = true;

  if (item.href) {
    const itemUrl = Url.create(item.href);
    const handleSearchQueryClick =
      isBandcampMusicUrl(currentPageUrl) &&
      currentPageUrl.hasSameHostname(itemUrl);
    handleDefaultClick = !handleSearchQueryClick;

    // Prevent default navigation for music items and set the search query instead
    if (event?.currentTarget instanceof HTMLAnchorElement) {
      event?.preventDefault();
    }

    if (handleDefaultClick) {
      // Handle default navigation for non-music pages (e.g., open in new tab)
      // For keyboard events, manually navigate since we can't rely on default browser behavior
      if (
        (event instanceof KeyboardEvent || event instanceof MouseEvent) &&
        item.href
      ) {
        window.open(item.href, '_self');
      }
      return;
    }
  }

  if (item.query) {
    musicFilterStore.setSearchQuery(item.query);
  }

  if (onItemClick) {
    onItemClick(item, event);
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

function updateTreeImages(detailsElement: HTMLDetailsElement) {
  const images = detailsElement.querySelectorAll(
    ':scope > ol > li > a > img.bcx-tree-item-img, ' +
      ':scope > summary > img.bcx-tree-item-img',
  ) as NodeListOf<HTMLImageElement>;
  images.forEach((img) => {
    const dataSrc = img.getAttribute('data-src');
    if (dataSrc && img.src !== dataSrc) {
      img.src = dataSrc;
    }
  });
}

function handleFilterKeyDown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    focusTreeItem(effectiveTreeData.visibleFirst);
  }
}
</script>

{#snippet treeItemButtons(buttons: TreeItemButton[] | undefined)}
  {#if buttons && buttons.length > 0}
    <div class="ml-auto flex gap-1 flex-shrink-0" role="presentation">
      {#each buttons as button}
        {@const Icon = button.icon}
        {#if button.href}
          <a
            href={button.href}
            title={button.title}
            class="inline-flex items-center justify-center p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
            onclick={(e) => {
              e.stopPropagation();
              if (button.onClick) {
                e.preventDefault();
                button.onClick(e.currentTarget as HTMLElement);
              }
            }}
          >
            <Icon size={16} />
          </a>
        {:else}
          <button
            type="button"
            title={button.title}
            class="cursor-pointer inline-flex items-center justify-center p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
            onclick={(e) => {
              e.stopPropagation();
              if (button.onClick) {
                button.onClick(e.currentTarget as HTMLElement);
              }
            }}
          >
            <Icon size={16} />
          </button>
        {/if}
      {/each}
    </div>
  {/if}
{/snippet}

{#snippet treeItems(items: TreeItem[] | undefined)}
  {#if items && items.length > 0}
    <ol class="ml-0 mt-0 border-l border-gray-500/50 pl-2">
      {#each items as item}
        <li>
          {#if item.children && item.children.length > 0}
            <details
              open={item.open}
              class="group"
              data-level="{item.level}"
              data-path="{item.path}"
              ontoggle={(e) => {
                item.open = e.currentTarget.open;
                // Update images when details is opened
                if (e.currentTarget.open) {
                  updateTreeImages(e.currentTarget);
                }
              }}
            >
              <summary
                class="tree-item cursor-pointer select-none px-0 hover:bg-white/10 transition-colors focus:bg-white/20 focus:ring-2 focus:ring-blue-400"
                class:focused={focusedPath === item.path}
                tabindex={focusedPath === item.path ? 0 : -1}
                onclick={(e) => handleItemClick(item, e)}
              >
                {#if item.image}
                <img src="{getExtensionUrl('assets/0.gif')}" data-src="{item.image}" alt="{item.label}" class="bcx-tree-item-img w-6 h-6 flex-shrink-0" />
                {/if}
                <span>{item.label}</span>
                {#if item.href && !item.query}
                <ExternalLink size={16} class="ml-1 flex-shrink-0" />
                {/if}
                <span class="item-count text-sm text-gray-400">({getVisibleChildrenCount(item, debouncedFilterQuery)})</span>
                {@render treeItemButtons(item.buttons)}
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
              href="{item.href || '#'}"
              title="{item.href || ''}"
              >
              {#if item.image}
              <img src="{getExtensionUrl('assets/0.gif')}" data-src="{item.image}" alt="{item.label}" class="bcx-tree-item-img w-6 h-6 flex-shrink-0" />
              {/if}
              <span class="ml-2 text-wrap">{item.label}</span>
              {#if item.href && !item.query}
              <ExternalLink size={16} class="ml-1 flex-shrink-0" />
              {/if}
              {@render treeItemButtons(item.buttons)}
            </a>
          {/if}
        </li>
      {/each}
    </ol>
  {/if}
{/snippet}

<div class="flex flex-col h-full gap-2">
  <input
    bind:this={filterInput}
    id="bcx-tree-view-filter"
    type="text"
    placeholder="Filter items..."
    bind:value={filterQuery}
    onkeydown={handleFilterKeyDown}
    list="bcx-tree-view-filter-datalist"
    class="px-3 py-2 rounded bg-gray-700 text-white text-sm opacity-50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
  />
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
    {#if debouncedFilterQuery.trim() && effectiveTreeData.items && effectiveTreeData.items.length === 0}
      <div class="text-gray-400 text-sm text-center py-4">
        No items match your filter
      </div>
    {:else if effectiveTreeData.items}
      {@render treeItems(effectiveTreeData.items)}
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

.bcx-tree-view .tree-item .item-count {
    margin-left: 0.2rem;
}
</style>
