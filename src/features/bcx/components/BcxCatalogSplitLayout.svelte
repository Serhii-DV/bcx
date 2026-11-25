<script lang="ts">
import type { Snippet } from 'svelte';

let {
  groupLabel,
  itemLabel,
  groups,
  children,
}: {
  groupLabel: string;
  itemLabel: string;
  groups?: Snippet;
  children: Snippet;
} = $props();
</script>

<div class="catalog-split-panel" class:full-width={!groups}>
  {#if groups}
    <div class="catalog-group-list" role="region" aria-label={groupLabel}>
      {@render groups()}
    </div>
  {/if}
  <div class="catalog-item-list" role="region" aria-label={itemLabel}>
    {@render children()}
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
.catalog-split-panel.full-width { grid-template-columns: minmax(0, 1fr); }
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
.full-width .catalog-item-list { border-inline-start: 0; padding-inline-start: 0; }
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
</style>
