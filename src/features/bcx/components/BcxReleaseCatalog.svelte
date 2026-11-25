<script lang="ts">
import { ListFilter } from '@lucide/svelte';
import { TreeData } from 'src/features/treeview/TreeData';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import type { ComponentProps } from 'svelte';
import BcxReleaseFilters from './BcxReleaseFilters.svelte';
import BcxRootSectionTabs from './BcxRootSectionTabs.svelte';
import {
  createReleasePredicate,
  type ReleaseFilterCategory,
  type ReleaseFilterDefinition,
  type ReleaseFilterMode,
  type ReleaseFilterSelection,
  type ReleaseFilterSorts,
} from './releaseFilters';

const DEFAULT_FILTER_MODE: ReleaseFilterMode = 'single';

let {
  treeData,
  categories,
  catalogIdentity,
  filterPaneOpen = $bindable(false),
  ...tabs
}: Omit<
  ComponentProps<typeof BcxRootSectionTabs>,
  | 'releaseFilterActions'
  | 'releaseFilterControls'
  | 'releaseFilterPane'
  | 'releaseItemFilter'
> & {
  categories: readonly ReleaseFilterDefinition[];
  catalogIdentity?: string;
  filterPaneOpen?: boolean;
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
const releases = $derived(
  catalog.items.find((item) => item.label === 'Releases'),
);
const hasReleases = $derived(
  !!releases?.releasePreview &&
    (releases.childrenCount ?? releases.children?.length ?? 0) > 0,
);
let selections = $state.raw<ReleaseFilterSelection[]>([]);
const filterButtonLabel = $derived(
  selections.length ? `Filters, ${selections.length} selected` : 'Filters',
);
let filterCategory = $state<ReleaseFilterCategory>('Artists');
let filterMode = $state<ReleaseFilterMode>(DEFAULT_FILTER_MODE);
let filterValueQuery = $state('');
let filterSorts = $state.raw<ReleaseFilterSorts>({});
let applyingFilters = $state(false);
let filterApplyFailed = $state(false);
let filterRetry = $state(0);
let appliedFilter = $state.raw<{
  roots: TreeItem[];
  identity: string | undefined;
  matches: (item: TreeItem) => boolean;
}>();
const releaseItemFilter = $derived(
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
  filterCategory = 'Artists';
  filterMode = DEFAULT_FILTER_MODE;
  filterValueQuery = '';
  filterSorts = {};
});

$effect(() => {
  filterRetry;
  const selected = selections;
  const identity = catalogIdentity;
  const roots = filterRoots;
  const shouldApply = selected.length > 0 && hasReleases;
  filterApplyFailed = false;
  applyingFilters = shouldApply;
  if (!selected.length) appliedFilter = undefined;
  if (!shouldApply) return;

  let current = true;
  void createReleasePredicate(roots, selected)
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

function setFilterMode(mode: ReleaseFilterMode) {
  filterMode = mode;
  if (mode === 'single' && selections.length > 1) {
    selections = selections.slice(-1);
  }
}

function toggleFilter(category: ReleaseFilterCategory, value: string) {
  const matches = (selection: ReleaseFilterSelection) =>
    selection.category === category && selection.value === value;
  if (selections.some(matches)) {
    selections = selections.filter((selection) => !matches(selection));
    return;
  }
  const selected = { category, value };
  selections = filterMode === 'single' ? [selected] : [...selections, selected];
}
</script>

{#snippet releaseFilterControls()}
  <button type="button" class="bcx-section-tab release-filters-trigger" aria-expanded={filterPaneOpen} aria-label={filterButtonLabel} title={filterButtonLabel} onclick={() => { filterPaneOpen = !filterPaneOpen; }}>
    <ListFilter size={14} aria-hidden="true" />
    <span class="release-filters-label">Filters{selections.length ? ` (${selections.length})` : ''}</span>
  </button>
{/snippet}

{#snippet releaseFilterPane()}
  <BcxReleaseFilters roots={filterRoots} {categories} bind:category={filterCategory} bind:query={filterValueQuery} bind:sorts={filterSorts} mode={filterMode} onModeChange={setFilterMode} {selections} applying={applyingFilters} applyFailed={filterApplyFailed} onToggle={toggleFilter} onClear={() => { selections = []; }} onRetry={() => { filterRetry += 1; }} />
{/snippet}

<BcxRootSectionTabs
  {...tabs}
  treeData={catalog}
  releaseFilterActions
  {releaseItemFilter}
  releaseFilterControls={hasReleases && filterRoots.length ? releaseFilterControls : undefined}
  releaseFilterPane={filterPaneOpen ? releaseFilterPane : undefined}
/>

<style>
.bcx-section-tab.release-filters-trigger { flex: none; min-height: 36px; gap: 0.375rem; padding: 6px 8px; border: 1px solid #4b5563; background: #374151; }
.release-filters-trigger[aria-expanded='true'] { border-color: #38bdf8; }
</style>
