<script module lang="ts">
let filterPaneOpen = $state(false);
</script>

<script lang="ts">
import { ListFilter } from '@lucide/svelte';
import { TreeData } from 'src/features/treeview/TreeData';
import {
  TREE_ITEM_LAYOUT,
  type TreeItem,
} from 'src/features/treeview/TreeItem';
import { ICON_DISC, ICON_INFO } from 'src/features/treeview/utils/icon';
import type { Snippet } from 'svelte';
import BcxBandActions from './BcxBandActions.svelte';
import BcxBandDetails from './BcxBandDetails.svelte';
import BcxBandReleaseFilters from './BcxBandReleaseFilters.svelte';
import BcxPanelHeading from './BcxPanelHeading.svelte';
import BcxRootSectionTabs from './BcxRootSectionTabs.svelte';
import {
  type BandReleaseFilterCategory,
  type BandReleaseFilterMode,
  type BandReleaseFilterSelection,
  type BandReleaseFilterSorts,
  createBandReleasePredicate,
  isBandReleaseFilterRoot,
} from './bandReleaseFilters';

const DEFAULT_FILTER_MODE: BandReleaseFilterMode = 'single';

let {
  treeData,
  about,
  fallbackLocation,
  bandUrl,
  initialSelectedHref,
  loading = false,
  error = '',
  navigationInFilter = false,
  leadingActions,
  trailingActions,
}: {
  treeData?: TreeData;
  about?: TreeItem;
  fallbackLocation?: string;
  bandUrl?: string;
  initialSelectedHref?: string;
  loading?: boolean;
  error?: string;
  navigationInFilter?: boolean;
  leadingActions?: Snippet;
  trailingActions?: Snippet;
} = $props();
let panel = $state<HTMLDivElement>();
let compactActions = $state(false);

$effect(() => {
  const element = panel;
  if (!element) return;
  const measure = () => {
    compactActions = element.clientWidth < 640;
  };
  const observer = new ResizeObserver(measure);
  observer.observe(element);
  measure();
  return () => observer.disconnect();
});

let bandAbout = $derived(
  about ?? treeData?.items.find((item) => item.aboutProfile),
);
const bandIdentity = $derived(bandUrl ?? bandAbout?.aboutProfile?.url);
const filterRoots = $derived(
  treeData?.items.filter(isBandReleaseFilterRoot) ?? [],
);
const releases = $derived(
  treeData?.items.find((item) => item.label === 'Releases'),
);
const releasesPath = $derived(releases?.path ?? 'band-releases');
const hasReleases = $derived(
  (releases?.childrenCount ?? releases?.children?.length ?? 0) > 0,
);
let selections = $state.raw<BandReleaseFilterSelection[]>([]);
const filterButtonLabel = $derived(
  selections.length ? `Filters, ${selections.length} selected` : 'Filters',
);
let filterCategory = $state<BandReleaseFilterCategory>('Artists');
let filterMode = $state<BandReleaseFilterMode>(DEFAULT_FILTER_MODE);
let filterValueQuery = $state('');
let filterSorts = $state.raw<BandReleaseFilterSorts>({});
let applyingFilters = $state(false);
let filterApplyFailed = $state(false);
let filterRetry = $state(0);
let appliedFilter = $state.raw<{
  roots: TreeItem[];
  band: string | undefined;
  matches: (item: TreeItem) => boolean;
}>();
const releaseItemFilter = $derived(
  selections.length &&
    appliedFilter?.roots === filterRoots &&
    appliedFilter.band === bandIdentity
    ? appliedFilter.matches
    : undefined,
);
let lastBandIdentity: string | undefined;

$effect(() => {
  if (!bandIdentity || lastBandIdentity === bandIdentity) return;
  lastBandIdentity = bandIdentity;
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
  const band = bandIdentity;
  const roots = filterRoots;
  const shouldApply = selected.length > 0 && hasReleases;
  filterApplyFailed = false;
  applyingFilters = shouldApply;
  if (!selected.length) appliedFilter = undefined;
  if (!shouldApply) return;

  let current = true;
  void createBandReleasePredicate(roots, selected)
    .then((matches) => {
      if (current) appliedFilter = { roots, band, matches };
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

function setFilterMode(mode: BandReleaseFilterMode) {
  filterMode = mode;
  if (mode === 'single' && selections.length > 1) {
    selections = selections.slice(-1);
  }
}

function toggleFilter(category: BandReleaseFilterCategory, value: string) {
  const matches = (selection: BandReleaseFilterSelection) =>
    selection.category === category && selection.value === value;
  if (selections.some(matches)) {
    selections = selections.filter((selection) => !matches(selection));
    return;
  }
  const selected = { category, value };
  selections = filterMode === 'single' ? [selected] : [...selections, selected];
}

let catalog = $derived.by(() => {
  const roots =
    treeData?.items.filter(
      (item) => !item.aboutProfile && !isBandReleaseFilterRoot(item),
    ) ?? [];
  const emptyReleases: TreeItem = {
    label: 'Releases',
    image: releases?.image ?? ICON_DISC,
    path: releasesPath,
    layout: TREE_ITEM_LAYOUT.TREE,
    showChildrenCount: false,
    children: [
      {
        label: loading
          ? 'Loading saved releases…'
          : error
            ? 'Could not read saved releases.'
            : 'No saved releases yet. Open the band’s Bandcamp page to explore its catalog.',
      },
    ],
  };
  return new TreeData(
    [
      ...(bandAbout
        ? [
            {
              ...bandAbout,
              image: bandAbout.image ?? ICON_INFO,
              path: 'band-about',
              showChildrenCount: false,
            },
          ]
        : []),
      ...roots.map((item) =>
        item === releases && !hasReleases ? emptyReleases : item,
      ),
      ...(!releases ? [emptyReleases] : []),
    ],
    treeData?.layout,
  );
});
</script>

{#snippet aboutContent(item: TreeItem)}
  <BcxBandDetails about={item} {fallbackLocation} {bandUrl} {loading} {error} showActions={false} />
{/snippet}

{#snippet bandActions()}
  {#if bandAbout}<BcxBandActions about={bandAbout} {bandUrl} iconOnly={compactActions} />{/if}
{/snippet}

{#snippet releaseFilterControls()}
  <button type="button" class="bcx-section-tab release-filters-trigger" aria-expanded={filterPaneOpen} aria-label={filterButtonLabel} title={filterButtonLabel} onclick={() => { filterPaneOpen = !filterPaneOpen; }}>
    <ListFilter size={14} aria-hidden="true" />
    <span class="release-filters-label">Filters{selections.length ? ` (${selections.length})` : ''}</span>
  </button>
{/snippet}

{#snippet releaseFilterPane()}
  <BcxBandReleaseFilters roots={filterRoots} bind:category={filterCategory} bind:query={filterValueQuery} bind:sorts={filterSorts} mode={filterMode} onModeChange={setFilterMode} {selections} applying={applyingFilters} applyFailed={filterApplyFailed} onToggle={toggleFilter} onClear={() => { selections = []; }} onRetry={() => { filterRetry += 1; }} />
{/snippet}

{#snippet panelHeading()}
  <BcxPanelHeading label={bandAbout?.aboutProfile?.name ?? 'Band'} image={bandAbout?.aboutProfile?.image ?? ICON_DISC} inline {leadingActions} {trailingActions} />
{/snippet}

<div bind:this={panel} class="band-panel">
  <BcxRootSectionTabs treeData={catalog} label="Band catalog sections" defaultRootPath={releasesPath} {initialSelectedHref} {aboutContent} heading={panelHeading} navigationInToolbar {navigationInFilter} navigationActions={bandAbout ? bandActions : undefined} compactWhenOverflowing countBadges releaseFilterActions {releaseItemFilter} releaseFilterControls={hasReleases && filterRoots.length ? releaseFilterControls : undefined} releaseFilterPane={filterPaneOpen ? releaseFilterPane : undefined} />
</div>

<style>
.band-panel { display: flex; flex: 1 1 0%; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; }
.bcx-section-tab.release-filters-trigger { flex: none; min-height: 36px; gap: 0.375rem; padding: 6px 8px; border: 1px solid #4b5563; background: #374151; }
.release-filters-trigger[aria-expanded='true'] { border-color: #38bdf8; }
</style>
