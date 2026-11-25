<script lang="ts">
import type { TreeItem } from 'src/features/treeview/TreeItem';
import BcxTreeFilterInput from './BcxTreeFilterInput.svelte';
import BcxTreeItem from './BcxTreeItem.svelte';
import {
  type BandReleaseFilterCategory,
  type BandReleaseFilterMode,
  type BandReleaseFilterSelection,
  bandReleaseFilterCategories,
  readBandReleaseFilterGroups,
} from './bandReleaseFilters';

let {
  roots,
  category = $bindable(),
  query = $bindable(),
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
  category: BandReleaseFilterCategory;
  query: string;
  mode: BandReleaseFilterMode;
  onModeChange: (mode: BandReleaseFilterMode) => void;
  selections: BandReleaseFilterSelection[];
  applying: boolean;
  applyFailed: boolean;
  onToggle: (category: BandReleaseFilterCategory, value: string) => void;
  onClear: () => void;
  onRetry: () => void;
} = $props();
const filterId = $props.id();
let groupRetry = $state(0);
const groups = $derived.by(() => {
  groupRetry;
  return readBandReleaseFilterGroups(roots, category);
});
const selectedValues = $derived(
  selections
    .filter((selection) => selection.category === category)
    .map(({ value }) => value),
);

function getOptions(items: TreeItem[]) {
  const options = new Map<string, TreeItem>();
  for (const item of items) {
    if (item.label) options.set(item.label, item);
  }
  for (const value of selectedValues) {
    if (!options.has(value)) options.set(value, { label: value });
  }
  return options;
}

function categoryLabel(option: (typeof bandReleaseFilterCategories)[number]) {
  const count = selections.filter(
    ({ category }) => category === option.rootLabel,
  ).length;
  return count ? `${option.label} (${count})` : option.label;
}
</script>

<select aria-label="Filter category" bind:value={category} onchange={() => { query = ''; }}>
  {#each bandReleaseFilterCategories as option (option.rootLabel)}
    <option value={option.rootLabel}>{categoryLabel(option)}</option>
  {/each}
</select>

<select aria-label="Filter selection mode" value={mode} onchange={(event) => onModeChange(event.currentTarget.value === 'single' ? 'single' : 'multiple')}>
  <option value="multiple">Multi-select</option>
  <option value="single">Single select</option>
</select>

{#await groups}
  <p role="status">Loading filter values…</p>
{:then items}
  {@const options = getOptions(items)}
  {@const suggestions = [...options.keys()]}
  {@const normalizedQuery = query.trim().toLocaleLowerCase()}
  {@const visibleOptions = [...options].filter(([label]) => label.toLocaleLowerCase().includes(normalizedQuery))}
  <BcxTreeFilterInput id={filterId} bind:value={query} {suggestions} placeholder="Filter values…" visibleCount={visibleOptions.length} totalCount={options.size} />
  <div class="bcx-tree-view release-filter-values">
    {#each visibleOptions as [value, item] (value)}
      <button type="button" class="release-filter-row" aria-pressed={selectedValues.includes(value)} title={value} onclick={() => onToggle(category, value)}>
        <BcxTreeItem {item} showButtons={false} />
      </button>
    {:else}
      <p role="status">{normalizedQuery ? 'No matching values.' : 'No filter values available.'}</p>
    {/each}
  </div>
{:catch}
  <p role="status">Could not load filter values.</p>
  <button type="button" class="release-filter-action" onclick={() => { groupRetry += 1; }}>Retry</button>
{/await}
{#if selections.length}
  <button type="button" class="release-filter-action clear-release-filters" onclick={onClear}>Clear filters</button>
{/if}
{#if applying}
  <p role="status">Applying filters…</p>
{:else if applyFailed}
  <p role="status">Could not apply filters.</p>
  <button type="button" class="release-filter-action" onclick={onRetry}>Retry filters</button>
{/if}

<style>
select, .release-filter-action { min-width: 0; padding: 0.375rem 0.25rem; border: 1px solid #4b5563; border-radius: 0.25rem; background: #111827; font-size: 0.8125rem; }
select { margin-bottom: 0.5rem; }
.release-filter-action { margin-top: 0.25rem; }
.release-filter-action:hover { background: #374151; }
.release-filter-values { flex: 1 1 0%; min-height: 0; overflow-y: auto; margin-top: 0.25rem; }
.release-filter-row { display: flex; align-items: center; width: 100%; padding: 0.25rem; cursor: pointer; overflow-wrap: anywhere; text-align: left; font-size: 0.875rem; }
.release-filter-row:hover { background: rgb(255 255 255 / 0.1); }
.release-filter-row[aria-pressed='true'] { background: rgb(56 189 248 / 0.13); box-shadow: inset 2px 0 #38bdf8; }
.release-filter-row:focus-visible { outline: 2px solid #38bdf8; outline-offset: -2px; }
.release-filter-row :global(.item-actions) { padding-inline-start: 0.25rem; }
p { margin: 0.25rem 0; overflow-wrap: anywhere; color: #9ca3af; font-size: 0.8125rem; }
</style>
