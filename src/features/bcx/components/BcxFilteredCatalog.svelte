<script module lang="ts">
let filterPaneOpen = $state(false);
</script>

<script lang="ts">
import { ListFilter } from '@lucide/svelte';
import { TreeData } from 'src/features/treeview/TreeData';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import { type ComponentProps, untrack } from 'svelte';
import BcxCatalogFilters from './BcxCatalogFilters.svelte';
import BcxRootSectionTabs from './BcxRootSectionTabs.svelte';
import {
  type CatalogFilterCategory,
  type CatalogFilterDefinition,
  type CatalogFilterMode,
  type CatalogFilterSelection,
  type CatalogFilterSorts,
  createCatalogPredicate,
} from './catalogFilters';

const DEFAULT_FILTER_MODE: CatalogFilterMode = 'single';

let {
  treeData,
  categories,
  sortBands = false,
  catalogIdentity,
  ...tabs
}: Omit<
  ComponentProps<typeof BcxRootSectionTabs>,
  | 'releaseFilterActions'
  | 'catalogFilterControls'
  | 'catalogFilterPane'
  | 'catalogItemFilter'
> & {
  categories: readonly CatalogFilterDefinition[];
  catalogIdentity?: string;
} = $props();

const filterRoots = $derived(
  treeData.items.filter((item) =>
    categories.some(({ rootLabel }) => rootLabel === item.label),
  ),
);
const catalog = $derived(
  new TreeData(
    treeData.items.filter((item) => !filterRoots.includes(item)),
    treeData.layout,
  ),
);
const resultsRoot = $derived(
  catalog.items.find((item) =>
    sortBands
      ? item.label === 'Latest added'
      : item.releasePreview && item.label === 'Releases',
  ),
);
const hasItems = $derived(
  !!resultsRoot &&
    (resultsRoot.childrenCount ?? resultsRoot.children?.length ?? 0) > 0,
);
let selections = $state.raw<CatalogFilterSelection[]>([]);
const filterButtonLabel = $derived(
  selections.length ? `Filters, ${selections.length} selected` : 'Filters',
);
const defaultCategory = $derived(categories[0]?.rootLabel ?? 'Artists');
let filterCategory = $state<CatalogFilterCategory>(
  untrack(() => defaultCategory),
);
let filterMode = $state<CatalogFilterMode>(DEFAULT_FILTER_MODE);
let filterValueQuery = $state('');
let filterSorts = $state.raw<CatalogFilterSorts>({});
let applyingFilters = $state(false);
let filterApplyFailed = $state(false);
let filterRetry = $state(0);
let appliedFilter = $state.raw<{
  roots: TreeItem[];
  identity: string | undefined;
  matches: (item: TreeItem) => boolean;
}>();
const catalogItemFilter = $derived(
  selections.length &&
    appliedFilter?.roots === filterRoots &&
    appliedFilter.identity === catalogIdentity
    ? appliedFilter.matches
    : undefined,
);
let lastCatalogIdentity: string | undefined;

$effect(() => {
  if (!catalogIdentity || lastCatalogIdentity === catalogIdentity) return;
  lastCatalogIdentity = catalogIdentity;
  selections = [];
  appliedFilter = undefined;
  filterCategory = defaultCategory;
  filterMode = DEFAULT_FILTER_MODE;
  filterValueQuery = '';
  filterSorts = {};
});

$effect(() => {
  filterRetry;
  const selected = selections;
  const identity = catalogIdentity;
  const roots = filterRoots;
  const shouldApply = selected.length > 0 && hasItems;
  filterApplyFailed = false;
  applyingFilters = shouldApply;
  if (!selected.length) appliedFilter = undefined;
  if (!shouldApply) return;

  let current = true;
  void createCatalogPredicate(roots, selected)
    .then((matches) => {
      if (current) appliedFilter = { roots, identity, matches };
    })
    .catch(() => {
      if (current) filterApplyFailed = true;
    })
    .finally(() => {
      if (current) applyingFilters = false;
    });
  return () => {
    current = false;
  };
});

function setFilterMode(mode: CatalogFilterMode) {
  filterMode = mode;
  if (mode === 'single' && selections.length > 1) {
    selections = selections.slice(-1);
  }
}

function toggleFilter(category: CatalogFilterCategory, value: string) {
  const matches = (selection: CatalogFilterSelection) =>
    selection.category === category && selection.value === value;
  if (selections.some(matches)) {
    selections = selections.filter((selection) => !matches(selection));
    return;
  }
  const selected = { category, value };
  selections = filterMode === 'single' ? [selected] : [...selections, selected];
}
</script>

{#snippet catalogFilterControls()}
  <button type="button" class="bcx-section-tab catalog-filters-trigger" aria-expanded={filterPaneOpen} aria-label={filterButtonLabel} title={filterButtonLabel} onclick={() => { filterPaneOpen = !filterPaneOpen; }}>
    <ListFilter size={14} aria-hidden="true" />
    <span class="catalog-filters-label">Filters{selections.length ? ` (${selections.length})` : ''}</span>
  </button>
{/snippet}

{#snippet catalogFilterPane()}
  <BcxCatalogFilters roots={filterRoots} {categories} bind:category={filterCategory} bind:query={filterValueQuery} bind:sorts={filterSorts} mode={filterMode} onModeChange={setFilterMode} {selections} applying={applyingFilters} applyFailed={filterApplyFailed} onToggle={toggleFilter} onClear={() => { selections = []; }} onRetry={() => { filterRetry += 1; }} />
{/snippet}

<BcxRootSectionTabs
  {...tabs}
  treeData={catalog}
  {sortBands}
  releaseFilterActions={!sortBands}
  {catalogItemFilter}
  catalogFilterControls={hasItems && filterRoots.length ? catalogFilterControls : undefined}
  catalogFilterPane={filterPaneOpen ? catalogFilterPane : undefined}
/>

<style>
.bcx-section-tab.catalog-filters-trigger { flex: none; min-height: 36px; gap: 0.375rem; padding: 6px 8px; border: 1px solid #4b5563; background: #374151; }
.catalog-filters-trigger[aria-expanded='true'] { border-color: #38bdf8; }
</style>
