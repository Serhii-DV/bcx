<script lang="ts">
import BcxTreeView from './BcxTreeView.svelte';
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

{#if items.length > 0}
  <ol style="background-color: #24282a;">
    {#each items as item}
      <li>
        {#if item.children && item.children.length > 0}
          <details bind:open={item.open} class="group">
            <summary
              class="cursor-pointer select-none rounded px-2 py-1 text-sm font-medium text-white hover:bg-white/10 transition-colors"
              onclick={() => handleItemClick(item)}
            >
              {item.label}
            </summary>
            <ol class="ml-3 mt-1 border-l border-gray-500/50 pl-2">
              <BcxTreeView items={item.children} {onItemClick} />
            </ol>
          </details>
        {:else}
          <button
            class="w-full cursor-pointer text-left rounded px-2 py-1 text-sm text-gray-200 hover:bg-white/10 transition-colors"
            onclick={() => handleItemClick(item)}
          >
            <span class="ml-2">{item.label}</span>
          </button>
        {/if}
      </li>
    {/each}
  </ol>
{/if}
