<script lang="ts">
import type { TreeItem } from './types';

interface Props {
  items: TreeItem[];
  onItemClick?: (item: TreeItem) => void;
}

let { items, onItemClick = () => {} }: Props = $props();

let treeContainer: HTMLDivElement;
let focusedPath: string | null = $state(null);

// Flatten the tree to get all visible items for navigation
function getVisibleItems(
  items: TreeItem[],
  result: TreeItem[] = [],
): TreeItem[] {
  for (const item of items) {
    result.push(item);
    if (item.children && item.children.length > 0 && item.open) {
      getVisibleItems(item.children, result);
    }
  }
  return result;
}

function handleItemClick(item: TreeItem) {
  focusedPath = item.path ?? null;
  console.log('[treeview] handleItemClick', item);
  onItemClick(item);
}

function handleKeyDown(event: KeyboardEvent) {
  if (!treeContainer) return;

  const visibleItems = getVisibleItems(items);
  const currentIndex = visibleItems.findIndex(
    (item) => item.path === focusedPath,
  );
  console.log(
    '[treeview]',
    event.key,
    'focusedPath:',
    focusedPath,
    'currentIndex:',
    currentIndex,
    'visibleItems:',
    visibleItems.length,
  );
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      if (currentIndex < visibleItems.length - 1) {
        const nextItem = visibleItems[currentIndex + 1];
        focusElement(nextItem.path);
      }
      break;

    case 'ArrowUp':
      event.preventDefault();
      if (currentIndex > 0) {
        const prevItem = visibleItems[currentIndex - 1];
        focusElement(prevItem.path);
      }
      break;

    case 'ArrowRight':
      event.preventDefault();
      if (currentIndex >= 0) {
        const currentItem = visibleItems[currentIndex];
        if (currentItem.children && currentItem.children.length > 0) {
          if (!currentItem.open) {
            currentItem.open = true;
          } else {
            // Move to first child
            const nextVisibleItems = getVisibleItems(items);
            const nextIndex =
              nextVisibleItems.findIndex((item) => item.path === focusedPath) +
              1;
            if (nextIndex < nextVisibleItems.length) {
              const nextItem = nextVisibleItems[nextIndex];
              focusElement(nextItem.path);
            }
          }
        }
      }
      break;

    case 'ArrowLeft':
      event.preventDefault();
      if (currentIndex >= 0) {
        const currentItem = visibleItems[currentIndex];
        if (
          currentItem.children &&
          currentItem.children.length > 0 &&
          currentItem.open
        ) {
          currentItem.open = false;
        } else {
          // Move to parent
          const parentPath = getParentPath(currentItem.path);
          if (parentPath) {
            const parentItem = findItemByPath(items, parentPath);
            if (parentItem) {
              focusElement(parentItem.path);
            }
          }
        }
      }
      break;

    case 'Enter':
    case ' ':
      event.preventDefault();
      if (currentIndex >= 0) {
        const currentItem = visibleItems[currentIndex];
        handleItemClick(currentItem);
      }
      break;

    case 'Home':
      event.preventDefault();
      if (visibleItems.length > 0) {
        const firstItem = visibleItems[0];
        focusElement(firstItem.path);
      }
      break;

    case 'End':
      event.preventDefault();
      if (visibleItems.length > 0) {
        const lastItem = visibleItems[visibleItems.length - 1];
        focusElement(lastItem.path);
      }
      break;
  }
}

function focusElement(path?: string) {
  const element = treeContainer.querySelector(
    `[data-path="${path}"]`,
  ) as HTMLElement;
  if (element) {
    focusedPath = path ?? null;
    element.focus();
  }
}

function getParentPath(path?: string): string | null {
  if (!path) return null;
  const parts = path.split('/');
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join('/');
}

function findItemByPath(items: TreeItem[], path: string): TreeItem | null {
  for (const item of items) {
    if (item.path === path) return item;
    if (item.children) {
      const found = findItemByPath(item.children, path);
      if (found) return found;
    }
  }
  return null;
}
</script>

{#snippet treeItems(items: TreeItem[])}
  {#if items.length > 0}
    <ol>
      {#each items as item}
        <li>
          {#if item.children && item.children.length > 0}
            <details
              bind:open={item.open}
              class="group"
              data-level="{item.level}"
              data-path="{item.path}"
            >
              <summary
                class="cursor-pointer select-none px-2 py-1 hover:bg-white/10 transition-colors focus:bg-white/20 focus:ring-2 focus:ring-blue-400"
                class:focused={focusedPath === item.path}
                data-level="{item.level}"
                data-path="{item.path}"
                tabindex={focusedPath === item.path ? 0 : -1}
                onclick={() => handleItemClick(item)}
              >
                {item.label}
              </summary>
              <ol class="ml-3 mt-1 border-l border-gray-500/50 pl-2">
                {@render treeItems(item.children)}
              </ol>
            </details>
          {:else}
            <button
              class="w-full cursor-pointer text-left px-2 py-1 text-gray-200 hover:bg-white/10 transition-colors focus:bg-white/20 focus:ring-2 focus:ring-blue-400"
              class:focused={focusedPath === item.path}
              data-level="{item.level}"
              data-path="{item.path}"
              tabindex={focusedPath === item.path ? 0 : -1}
              onclick={() => handleItemClick(item)}
            >
              <span class="ml-2">{item.label}</span>
            </button>
          {/if}
        </li>
      {/each}
    </ol>
  {/if}
{/snippet}

<div
  bind:this={treeContainer}
  class="tree-view"
  role="tree"
  tabindex="0"
  onkeydown={handleKeyDown}
  onfocus={() => {
    // Set initial focus to first item if none is focused
    if (!focusedPath && items.length > 0) {
      const visibleItems = getVisibleItems(items);
      if (visibleItems.length > 0) {
        focusedPath = visibleItems[0].path ?? null;
        focusElement(visibleItems[0].path);
      }
    }
  }}
>
  {@render treeItems(items)}
</div>
