<script lang="ts">
import type { TreeItem } from 'src/features/treeview/TreeItem';
import type { Snippet } from 'svelte';
import BcxTreePanel from './BcxTreePanel.svelte';

let {
  root,
  groupLabel,
  itemLabel = 'Releases',
  emptyMessage,
  groups,
  items,
}: {
  root: TreeItem;
  groupLabel: string;
  itemLabel?: string;
  emptyMessage: string;
  groups: Snippet<[(group: TreeItem) => void, string | undefined]>;
  items?: Snippet<[TreeItem]>;
} = $props();
let selection = $state.raw<{ root: TreeItem; group: TreeItem }>();
const selectedGroup = $derived(
  selection?.root === root ? selection.group : undefined,
);

function selectGroup(group: TreeItem) {
  if (selectedGroup?.path !== group.path) selection = { root, group };
}
</script>

<div class="catalog-split-panel">
  <div class="catalog-group-list" role="region" aria-label={groupLabel}>
    {@render groups(selectGroup, selectedGroup?.path)}
  </div>
  <div class="catalog-item-list" role="region" aria-label={itemLabel}>
    {#if selectedGroup}
      {#key selectedGroup}
        {#if items}
          {@render items(selectedGroup)}
        {:else}
          <BcxTreePanel root={selectedGroup} showFilter={false} autoSelectPreview={false} />
        {/if}
      {/key}
    {:else}
      <p>{emptyMessage}</p>
    {/if}
  </div>
</div>

<style>
.catalog-split-panel {
  display: grid;
  flex: 1 1 0%;
  grid-template-columns: min(32%, 11rem) minmax(0, 1fr);
  gap: 0.5rem;
  min-height: 0;
  min-width: 0;
}
.catalog-group-list, .catalog-item-list {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}
.catalog-group-list { container-type: inline-size; }
.catalog-group-list :global(.bcx-browser-toolbar) {
  flex-wrap: nowrap;
  gap: 0.25rem;
}
.catalog-group-list :global(.bcx-tree-item-img) { width: 1.5rem; height: 1.5rem; }
.catalog-group-list :global(.item-url) { display: none; }
.catalog-item-list {
  border-inline-start: 1px solid rgb(156 163 175 / 0.25);
  padding-inline-start: 0.5rem;
}
@container (max-width: 10rem) {
  .catalog-group-list :global(.bcx-browser-toolbar:has(.bcx-tree-filter-clear)) {
    flex-wrap: wrap;
  }
  .catalog-group-list :global(.bcx-tree-filter-input) {
    padding-inline: 0.25rem;
  }
}
@container (max-width: 7rem) {
  .catalog-group-list :global(.bcx-tree-item-img:not(:has([class^='flag:']))) { display: none; }
  .catalog-group-list :global(.bcx-tree-filter-field:has(.bcx-tree-filter-clear)) {
    flex-wrap: wrap;
  }
  .catalog-group-list :global(.bcx-tree-filter-field:has(.bcx-tree-filter-clear) .bcx-tree-filter-input) {
    flex-basis: 100%;
  }
}
p { margin: 0; overflow-wrap: anywhere; color: #9ca3af; font-size: 0.875rem; }
</style>
