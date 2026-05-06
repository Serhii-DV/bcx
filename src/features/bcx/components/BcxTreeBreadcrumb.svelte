<script lang="ts">
import { House } from '@lucide/svelte';
import type { TreeItem } from 'src/features/treeview/TreeItem';

interface Props {
  items: TreeItem[];
  currentPath?: string | null;
  onNavigate: (path: string | null) => void;
}

let { items, currentPath = null, onNavigate }: Props = $props();
</script>

<nav class="bcx-tree-breadcrumb" aria-label="Tree location">
  <button
    type="button"
    class:current={!currentPath}
    title="Root"
    aria-label="Root"
    onclick={() => onNavigate(null)}
  >
    <House size="14" aria-hidden="true" />
  </button>
  {#each items as item}
    <span aria-hidden="true">&rsaquo;</span>
    <button
      type="button"
      class:current={item.path === currentPath}
      onclick={() => onNavigate(item.path || null)}
    >
      {item.label}
    </button>
  {/each}
</nav>

<style>
.bcx-tree-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1.5rem;
  font-size: 0.75rem;
  color: rgb(209 213 219);
}

.bcx-tree-breadcrumb button {
  display: inline-flex;
  align-items: center;
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
</style>
