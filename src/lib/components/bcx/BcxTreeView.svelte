<script lang="ts">
import type { TreeData } from 'src/app/treeview/treeData';
import type { TreeItem } from 'src/app/treeview/treeItem';
import { isNode, isNodeExpanded } from 'src/app/treeview/utils';

interface Props {
  treeData: TreeData;
  onItemClick?: (item: TreeItem, event?: MouseEvent) => void;
}

let { treeData, onItemClick = () => {} }: Props = $props();
let treeContainer: HTMLDivElement;
let focusedPath: string | null = $state(null);

function handleItemClick(item?: TreeItem | null, e?: MouseEvent) {
  if (!item) return;
  focusedPath = item.path ?? null;

  if (onItemClick) {
    onItemClick(item, e);
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (!treeContainer) return;

  event.preventDefault();

  const currentIndex = treeData.visibleIndex(focusedPath ?? '');

  switch (event.key) {
    case 'ArrowDown':
      focusTreeItem(treeData.findNextVisible(currentIndex));
      break;

    case 'ArrowUp':
      focusTreeItem(treeData.findPrevVisible(currentIndex));
      break;

    case 'ArrowRight':
      if (currentIndex >= 0) {
        const currentItem = treeData.findVisible(currentIndex);

        if (!currentItem) {
          break;
        }

        if (!isNodeExpanded(currentItem)) {
          expandNode(currentItem);
        } else {
          // Move to first child
          focusTreeItem(treeData.findFirstChildByPath(focusedPath));
        }
      }
      break;

    case 'ArrowLeft':
      if (currentIndex >= 0) {
        const currentItem = treeData.findVisible(currentIndex);

        if (!currentItem) {
          break;
        }

        if (isNodeExpanded(currentItem)) {
          collapseNode(currentItem);
        } else {
          // Move to parent
          focusTreeItem(treeData.findParentByPath(currentItem.path));
        }
      }
      break;

    case 'Enter':
    case ' ':
      handleItemClick(treeData.findVisible(currentIndex));
      break;

    case 'Home':
      focusTreeItem(treeData.firstVisible);
      break;

    case 'End':
      focusTreeItem(treeData.lastVisible);
      break;
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
</script>

{#snippet treeItems(items: TreeItem[])}
  {#if items.length > 0}
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
              }}
            >
              <summary
                class="cursor-pointer select-none px-0 py-1 hover:bg-white/10 transition-colors focus:bg-white/20 focus:ring-2 focus:ring-blue-400"
                class:focused={focusedPath === item.path}
                tabindex={focusedPath === item.path ? 0 : -1}
                onclick={(e) => handleItemClick(item, e)}
              >
                {item.label}
              </summary>
              <!-- <div class="ml-2 mt-0 border-l border-gray-500/50 pl-2"> -->
                {@render treeItems(item.children)}
              <!-- </div> -->
            </details>
          {:else}
            <a
              class="block w-full cursor-pointer text-left px-0 py-1 text-gray-200 hover:bg-white/10 transition-colors focus:bg-white/20 focus:ring-2 focus:ring-blue-400"
              class:focused={focusedPath === item.path}
              data-level="{item.level}"
              data-path="{item.path}"
              tabindex={focusedPath === item.path ? 0 : -1}
              onclick={(e) => handleItemClick(item, e)}
              href="{item.href || '#'}"
            >
              <span class="ml-2 text-nowrap">{item.label}</span>
            </a>
          {/if}
        </li>
      {/each}
    </ol>
  {/if}
{/snippet}

<div
  bind:this={treeContainer}
  class="tree-view pr-2 py-2"
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
