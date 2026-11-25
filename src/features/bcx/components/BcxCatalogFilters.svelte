<script lang="ts">
import { Tabs } from 'bits-ui';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import { makeIcon } from 'src/features/treeview/utils/icon';
import BcxSectionSort from './BcxSectionSort.svelte';
import BcxTreeFilterInput from './BcxTreeFilterInput.svelte';
import BcxTreeItem from './BcxTreeItem.svelte';
import {
  type CatalogFilterCategory,
  type CatalogFilterDefinition,
  type CatalogFilterMode,
  type CatalogFilterSelection,
  type CatalogFilterSorts,
  readCatalogFilterGroups,
} from './catalogFilters';

let {
  roots,
  categories,
  category = $bindable(),
  query = $bindable(),
  sorts = $bindable(),
  mode,
  onModeChange,
  selections,
  applying,
  applyFailed,
  onToggle,
  onClear,
  onRetry,
}: {
  roots: TreeItem[];
  categories: readonly CatalogFilterDefinition[];
  category: CatalogFilterCategory;
  query: string;
  sorts: CatalogFilterSorts;
  mode: CatalogFilterMode;
  onModeChange: (mode: CatalogFilterMode) => void;
  selections: CatalogFilterSelection[];
  applying: boolean;
  applyFailed: boolean;
  onToggle: (category: CatalogFilterCategory, value: string) => void;
  onClear: () => void;
  onRetry: () => void;
} = $props();
const selectionModes = [
  { value: 'single', label: 'Single' },
  { value: 'multiple', label: 'Multiple' },
] as const;
const filterId = $props.id();
let groupRetry = $state(0);
const groups = $derived.by(() => {
  groupRetry;
  return readCatalogFilterGroups(roots, category);
});
const selectedValues = $derived(
  selections
    .filter((selection) => selection.category === category)
    .map(({ value }) => value),
);
let optionCounts = $state.raw<Partial<Record<CatalogFilterCategory, number>>>(
  {},
);

$effect(() => {
  groupRetry;
  const catalogRoots = roots;
  let current = true;
  optionCounts = {};
  void Promise.allSettled(
    categories.map(async ({ rootLabel }) => {
      const items = await readCatalogFilterGroups(catalogRoots, rootLabel);
      return [rootLabel, getOptions(items).size] as const;
    }),
  ).then((results) => {
    if (current) {
      optionCounts = Object.fromEntries(
        results.flatMap((result) =>
          result.status === 'fulfilled' ? [result.value] : [],
        ),
      );
    }
  });
  return () => {
    current = false;
  };
});

function getOptions(items: TreeItem[], selected: string[] = []) {
  const options = new Map<string, TreeItem>();
  for (const item of items) {
    if (item.label) options.set(item.label, item);
  }
  for (const value of selected) {
    if (!options.has(value)) options.set(value, { label: value });
  }
  return options;
}

function selectCategory(value: string) {
  const next = categories.find(({ rootLabel }) => rootLabel === value);
  if (!next || category === next.rootLabel) return;
  category = next.rootLabel;
  query = '';
}
</script>

{#snippet categoryContent(option: CatalogFilterDefinition)}
  {#await groups}
    <p role="status">Loading filter values…</p>
  {:then items}
    {@const options = getOptions(items, selectedValues)}
    {@const sortValue = sorts[option.rootLabel] ?? option.sort.defaultSort}
    {@const compare = option.sort.comparator(sortValue)}
    {@const sortedOptions = compare ? [...options].sort(([, a], [, b]) => compare(a, b)) : [...options]}
    {@const suggestions = sortedOptions.map(([label]) => label)}
    {@const normalizedQuery = query.trim().toLocaleLowerCase()}
    {@const visibleOptions = sortedOptions.filter(([label]) => label.toLocaleLowerCase().includes(normalizedQuery))}
    <div class="catalog-filter-toolbar">
      <div class="catalog-filter-input">
        <BcxTreeFilterInput id={filterId} bind:value={query} {suggestions} placeholder="Filter values…" visibleCount={visibleOptions.length} totalCount={options.size} />
      </div>
      <BcxSectionSort item={{ sortLabel: option.sort.sortLabel, sortOptions: option.sort.sortOptions, sortValue }} iconOnly onValueChange={(id) => { sorts = { ...sorts, [option.rootLabel]: id }; }} />
    </div>
    <div class="bcx-tree-view catalog-filter-values">
      {#each visibleOptions as [value, item] (value)}
        <button type="button" class="catalog-filter-row" aria-pressed={selectedValues.includes(value)} title={value} onclick={() => onToggle(category, value)}>
          <BcxTreeItem {item} showButtons={false} />
        </button>
      {:else}
        <p role="status">{normalizedQuery ? 'No matching values.' : 'No filter values available.'}</p>
      {/each}
    </div>
  {:catch}
    <p role="status">Could not load filter values.</p>
    <button type="button" class="catalog-filter-action" onclick={() => { groupRetry += 1; }}>Retry</button>
  {/await}
  {#if selections.length}
    <button type="button" class="catalog-filter-action clear-catalog-filters" onclick={onClear}>Clear filters</button>
  {/if}
  {#if applying}
    <p role="status">Applying filters…</p>
  {:else if applyFailed}
    <p role="status">Could not apply filters.</p>
    <button type="button" class="catalog-filter-action" onclick={onRetry}>Retry filters</button>
  {/if}
{/snippet}

<Tabs.Root value={category} onValueChange={selectCategory} class="catalog-filter-tabs">
  <Tabs.List aria-label="Filter category" class="catalog-filter-tab-list">
    {#each categories as option (option.rootLabel)}
      {@const Icon = makeIcon(option.icon)}
      {@const count = selections.filter((selection) => selection.category === option.rootLabel).length}
      {@const total = optionCounts[option.rootLabel]}
      {@const name = total === undefined ? option.label : `${option.label} (${total})`}
      {@const label = count ? `${name}, ${count} selected` : name}
      <Tabs.Trigger value={option.rootLabel} class="catalog-filter-tab" aria-label={label} title={label}>
        <Icon size={16} aria-hidden="true" />
        {#if count}<span class="catalog-filter-tab-indicator" aria-hidden="true"></span>{/if}
      </Tabs.Trigger>
    {/each}
  </Tabs.List>
  <fieldset class="catalog-filter-modes">
    <legend class="sr-only">Filter selection mode</legend>
    {#each selectionModes as option (option.value)}
      <label>
        <input class="sr-only" type="radio" name={`${filterId}-mode`} value={option.value} checked={mode === option.value} onchange={() => onModeChange(option.value)} />
        {option.label}
      </label>
    {/each}
  </fieldset>
  {#each categories as option (option.rootLabel)}
    <Tabs.Content value={option.rootLabel} class="catalog-filter-tab-content">
      {#if category === option.rootLabel}{@render categoryContent(option)}{/if}
    </Tabs.Content>
  {/each}
</Tabs.Root>

<style>
.catalog-filter-action { min-width: 0; padding: 0.375rem 0.25rem; border: 1px solid #4b5563; border-radius: 0.25rem; background: #111827; font-size: 0.8125rem; }
:global(.catalog-filter-tabs), :global(.catalog-filter-tab-content:not([hidden])) { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; min-width: 0; }
:global(.catalog-filter-tab-list) { display: grid; flex: none; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); margin-bottom: 0.25rem; }
:global(.catalog-filter-tab) { position: relative; display: grid; place-items: center; min-height: 1.75rem; border-bottom: 2px solid transparent; cursor: pointer; color: #d1d5db; }
:global(.catalog-filter-tab:hover), :global(.catalog-filter-tab[data-state='active']) { background: #374151; color: #f9fafb; }
:global(.catalog-filter-tab[data-state='active']) { border-bottom-color: #38bdf8; }
:global(.catalog-filter-tab:focus-visible), .catalog-filter-modes label:has(:focus-visible) { outline: 2px solid #38bdf8; outline-offset: -2px; }
.catalog-filter-tab-indicator { position: absolute; inset: 0.125rem 0.125rem auto auto; width: 0.3125rem; height: 0.3125rem; border-radius: 50%; background: #38bdf8; }
.catalog-filter-modes { display: grid; flex: none; grid-template-columns: repeat(2, minmax(0, 1fr)); min-width: 0; margin: 0 0 0.375rem; padding: 0; border: 1px solid #4b5563; border-radius: 0.25rem; background: #111827; }
.catalog-filter-modes label { display: grid; place-items: center; min-height: 1.5rem; padding-inline: 0.125rem; cursor: pointer; color: #d1d5db; font-size: 0.6875rem; }
.catalog-filter-modes label:has(:checked) { background: #374151; color: #f9fafb; box-shadow: inset 0 -1px #38bdf8; }
@container (max-width: 6rem) {
  :global(.catalog-filter-tab-list) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.catalog-filter-toolbar { display: flex; align-items: flex-start; gap: 0.25rem; }
.catalog-filter-input { flex: 1 1 0%; min-width: 0; }
@container (max-width: 10rem) {
  .catalog-filter-input :global(.bcx-tree-filter-field:has(.bcx-tree-filter-clear)) { flex-wrap: wrap; }
  .catalog-filter-input :global(.bcx-tree-filter-field:has(.bcx-tree-filter-clear) .bcx-tree-filter-input) { flex-basis: 100%; }
  .catalog-filter-input :global(.bcx-tree-filter-count) { padding-inline: 0; }
  .catalog-filter-input :global(.bcx-tree-filter-clear) { margin-inline: 0; }
}
.catalog-filter-action { margin-top: 0.25rem; }
.catalog-filter-action:hover { background: #374151; }
.catalog-filter-values { flex: 1 1 0%; min-height: 0; overflow-y: auto; margin-top: 0.25rem; }
.catalog-filter-row { display: flex; align-items: center; width: 100%; padding: 0.25rem; cursor: pointer; overflow-wrap: anywhere; text-align: left; font-size: 0.875rem; }
.catalog-filter-row:hover { background: rgb(255 255 255 / 0.1); }
.catalog-filter-row[aria-pressed='true'] { background: rgb(56 189 248 / 0.13); box-shadow: inset 2px 0 #38bdf8; }
.catalog-filter-row:focus-visible { outline: 2px solid #38bdf8; outline-offset: -2px; }
.catalog-filter-row :global(.item-actions) { padding-inline-start: 0.25rem; }
p { margin: 0.25rem 0; overflow-wrap: anywhere; color: #9ca3af; font-size: 0.8125rem; }
</style>
