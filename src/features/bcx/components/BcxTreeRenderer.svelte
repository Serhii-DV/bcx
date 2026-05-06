<script lang="ts">
import type { TreeItem } from 'src/features/treeview/TreeItem';
import { isNode } from 'src/features/treeview/utils';
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

let baseLevel = $derived.by(() => {
  if (!items || items.length === 0) {
    return 0;
  }

  return items.reduce((lowestLevel, item) => {
    const itemLevel = item.level ?? 0;
    return itemLevel < lowestLevel ? itemLevel : lowestLevel;
  }, items[0]?.level ?? 0);
});

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

function getItemDepth(item: TreeItem): number {
  const itemLevel = item.level ?? baseLevel;
  return Math.max(0, itemLevel - baseLevel);
}

function getItemIndentStyle(item: TreeItem): string {
  return `--tree-item-indent: ${getItemDepth(item)}rem;`;
}
</script>

{#snippet treeItems(nodes: TreeItem[] | undefined)}
  {#if nodes && nodes.length > 0}
    <ol class="tree-list">
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
                class="tree-item tree-node-summary cursor-pointer select-none px-0 hover:bg-white/10 transition-colors focus:bg-white/20"
                class:focused={focusedPath === item.path}
                tabindex={focusedPath === item.path ? 0 : -1}
                style={getItemIndentStyle(item)}
                title={item.hint}
                onclick={(event) => onNodeClick(item, event)}
              >
                <span class="tree-item-content">
                  <BcxTreeItem item={withVisibleChildCount(item)} />
                </span>
              </summary>
              {#if !item.isLoadingChildren}
                <div class="tree-children">
                  {@render treeItems(item.children)}
                </div>
              {/if}
            </details>
          {:else}
            <a
              class="tree-item tree-leaf flex items-center w-full cursor-pointer text-left px-0 py-0 text-gray-200 hover:bg-white/10 transition-colors focus:bg-white/20"
              class:focused={focusedPath === item.path}
              data-level="{item.level}"
              data-path="{item.path}"
              tabindex={focusedPath === item.path ? 0 : -1}
              style={getItemIndentStyle(item)}
              onclick={(event) => onItemClick(item, event)}
              href={item.href}
              title={item.hint}
            >
              <span class="tree-item-content">
                <BcxTreeItem item={withVisibleChildCount(item)} />
              </span>
            </a>
          {/if}
        </li>
      {/each}
    </ol>
  {/if}
{/snippet}

{@render treeItems(items)}

<style>
.tree-list {
  margin-top: 0;
  margin-left: 0;
  padding-left: 0;
}

.tree-node > .tree-node-summary,
.tree-leaf {
  width: 100%;
  border-radius: 4px;
  padding-left: 1.5rem;
  padding-block: 0.25rem;
  color: rgb(229 231 235);
  text-align: left;
  text-decoration: none;
  vertical-align: middle;
}

.tree-node[open] > .tree-node-summary::before {
  transform: translateY(-50%) rotate(90deg);
}

.tree-node > .tree-node-summary {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.tree-node > .tree-node-summary::before {
  position: absolute;
  top: 50%;
  left: 0.25rem;
  display: block;
  width: 1rem;
  height: 1rem;
  content: "";
  transform: translateY(-50%);
  transform-origin: center;
  background-color: currentcolor;
  -webkit-mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>');
          mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>');
  -webkit-mask-size: cover;
          mask-size: cover;
}

.tree-node > .tree-node-summary {
  padding-left: calc(1.5rem + var(--tree-item-indent, 0rem));
}

.tree-node > .tree-node-summary::before {
  left: calc(0.25rem + var(--tree-item-indent, 0rem));
}

.tree-leaf {
  display: flex;
}

.tree-item-content {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
}

.hidden {
    display: none;
}

.tree-leaf > .tree-item-content {
  margin-left: var(--tree-item-indent, 0rem);
}

.tree-children {
  margin-left: 0;
  padding-left: 0;
}
</style>
