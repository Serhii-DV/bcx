<script lang="ts">
import type { TreeItem } from './types';

interface Props {
  items: TreeItem[];
  onItemClick?: (item: TreeItem) => void;
}

let { items, onItemClick = () => {} }: Props = $props();

function handleItemClick(item: TreeItem) {
  onItemClick(item);
}
</script>

{#snippet treeItems(items: TreeItem[])}
  {#if items.length > 0}
    <ol>
      {#each items as item}
        <li>
          {#if item.children && item.children.length > 0}
            <details bind:open={item.open} class="group">
              <summary
                class="cursor-pointer select-none px-2 py-1 hover:bg-white/10 transition-colors"
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
              class="w-full cursor-pointer text-left px-2 py-1 text-gray-200 hover:bg-white/10 transition-colors"
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

{@render treeItems(items)}
