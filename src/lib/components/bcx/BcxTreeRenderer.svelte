<script lang="ts">
import type { TreeItem } from 'src/app/treeview/TreeItem';
import { isNode } from 'src/app/treeview/utils';
import BcxTreeItem from './BcxTreeItem.svelte';
import { getItemVisibleChildCount as getVisibleChildCount } from './treeViewHelpers';

interface Props {
  items?: TreeItem[];
  focusedPath?: string | null;
  filterQuery?: string;
  visiblePaths: Set<string>;
  visibleChildCounts: Map<string, number>;
  onItemClick: (item: TreeItem, event: MouseEvent) => void | Promise<void>;
  onNodeClick: (item: TreeItem, event: MouseEvent) => void;
}

let {
  items,
  focusedPath = null,
  filterQuery = '',
  visiblePaths,
  visibleChildCounts,
  onItemClick,
  onNodeClick,
}: Props = $props();

function isItemVisible(item: TreeItem): boolean {
  if (!filterQuery.trim()) {
    return true;
  }

  return visiblePaths.has(item.path || '');
}

function withVisibleChildCount(item: TreeItem): TreeItem {
  return {
    ...item,
    childrenCount: getVisibleChildCount(item, filterQuery, visibleChildCounts),
  };
}
</script>

{#snippet treeItems(nodes: TreeItem[] | undefined)}
  {#if nodes && nodes.length > 0}
    <ol class="ml-0 mt-0 border-l border-gray-500/50 pl-0">
      {#each nodes as item}
        <li class:hidden={!isItemVisible(item)}>
          {#if isNode(item)}
            <details
              open={item.open}
              class="group tree-node"
              data-level="{item.level}"
              data-path="{item.path}"
            >
              <summary
                class="tree-item tree-node-summary cursor-pointer select-none px-0 hover:bg-white/10 transition-colors focus:bg-white/20 focus:ring-2 focus:ring-blue-400"
                class:focused={focusedPath === item.path}
                tabindex={focusedPath === item.path ? 0 : -1}
                onclick={(event) => onNodeClick(item, event)}
              >
                <BcxTreeItem item={withVisibleChildCount(item)} />
              </summary>
              {#if !item.isLoadingChildren}
                <div class="tree-children">
                  {@render treeItems(item.children)}
                </div>
              {/if}
            </details>
          {:else}
            <a
              class="tree-item tree-leaf flex items-center w-full cursor-pointer pl-2 text-left px-0 py-0 text-gray-200 hover:bg-white/10 transition-colors focus:bg-white/20 focus:ring-2 focus:ring-blue-400"
              class:focused={focusedPath === item.path}
              data-level="{item.level}"
              data-path="{item.path}"
              tabindex={focusedPath === item.path ? 0 : -1}
              onclick={(event) => onItemClick(item, event)}
              href={item.href}
              title={item.href}
            >
              <BcxTreeItem item={withVisibleChildCount(item)} />
            </a>
          {/if}
        </li>
      {/each}
    </ol>
  {/if}
{/snippet}

{@render treeItems(items)}

<style>
.tree-node[open] > .tree-node-summary::before {
  transform: rotate(90deg);
}

.tree-node > .tree-node-summary {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.tree-node > .tree-node-summary::before {
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

.tree-leaf {
    display: inline-flex;
    padding-block: .25rem;
    vertical-align: middle;
}

.hidden {
    display: none;
}

.tree-children > ol > li > .tree-item,
.tree-children > ol > li > .tree-node > .tree-node-summary {
  padding-left: 1.5rem;
}
</style>
