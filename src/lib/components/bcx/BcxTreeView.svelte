<script lang="ts">
import type { TreeData } from 'src/app/treeview/treeData';
import type { TreeItem } from './types';

interface Props {
  treeData: TreeData;
  onItemClick?: (item: TreeItem) => void;
}

let { treeData, onItemClick = () => {} }: Props = $props();
let treeContainer: HTMLDivElement;
let focusedPath: string | null = $state(null);

function handleItemClick(item: TreeItem) {
  focusedPath = item.path ?? null;
  console.log('[treeview] handleItemClick', item, 'focusedPath:', focusedPath);
  onItemClick(item);
}

function handleKeyDown(event: KeyboardEvent) {
  if (!treeContainer) return;

  event.preventDefault();

  const currentIndex = treeData.getVisibleItemIndexByPath(focusedPath ?? '');

  console.log(
    '[treeview]',
    event.key,
    'focusedPath:',
    focusedPath,
    'currentIndex:',
    currentIndex,
    'visibleItems:',
    treeData.visibleItems.length,
  );
  switch (event.key) {
    case 'ArrowDown':
      if (currentIndex < treeData.visibleItems.length - 1) {
        const nextIndex = currentIndex + 1;
        const nextItem = treeData.visibleItems[nextIndex];
        focusTreeItem(nextItem);
      }
      break;

    case 'ArrowUp':
      if (currentIndex > 0) {
        const prevIndex = currentIndex - 1;
        const prevItem = treeData.visibleItems[prevIndex];
        focusTreeItem(prevItem);
      }
      break;

    case 'ArrowRight':
      if (currentIndex >= 0) {
        const currentItem = treeData.visibleItems[currentIndex];
        if (currentItem.children && currentItem.children.length > 0) {
          if (!currentItem.open) {
            currentItem.open = true;
          } else {
            // Move to first child
            const nextVisibleItems = treeData.visibleItems;
            const nextIndex =
              nextVisibleItems.findIndex((item) => item.path === focusedPath) +
              1;
            if (nextIndex < nextVisibleItems.length) {
              const nextItem = nextVisibleItems[nextIndex];
              focusTreeItem(nextItem);
            }
          }
        }
      }
      break;

    case 'ArrowLeft':
      if (currentIndex >= 0) {
        const currentItem = treeData.visibleItems[currentIndex];
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
            const parentItem = findItemByPath(treeData.items, parentPath);
            if (parentItem) {
              focusTreeItem(parentItem);
            }
          }
        }
      }
      break;

    case 'Enter':
    case ' ':
      if (currentIndex >= 0) {
        const currentItem = treeData.visibleItems[currentIndex];
        handleItemClick(currentItem);
      }
      break;

    case 'Home':
      focusTreeItem(treeData.firstVisible);
      break;

    case 'End':
      focusTreeItem(treeData.lastVisible);
      break;
  }
}

function focusTreeItem(item?: TreeItem) {
  if (item && item.path) {
    focusElement(item.path);
  }
}

function focusElement(path: string) {
  const element = treeContainer.querySelector(
    `[data-path="${path}"]`,
  ) as HTMLElement;

  if (element) {
    focusedPath = path;
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
    if (!focusedPath) {
      focusTreeItem(treeData.firstVisible);
    }
  }}
>
  {@render treeItems(treeData.items)}
</div>
