<script lang="ts">
import { ListFilter } from '@lucide/svelte';
import { TreeData } from 'src/features/treeview/TreeData';
import {
  TREE_ITEM_LAYOUT,
  type TreeItem,
} from 'src/features/treeview/TreeItem';
import {
  ICON_DISC,
  ICON_INFO,
  ICON_MENU,
} from 'src/features/treeview/utils/icon';
import type { Snippet } from 'svelte';
import BcxBandActions from './BcxBandActions.svelte';
import BcxBandDetails from './BcxBandDetails.svelte';
import BcxBandReleaseFilters from './BcxBandReleaseFilters.svelte';
import BcxRootSectionTabs from './BcxRootSectionTabs.svelte';
import BcxSectionTabs from './BcxSectionTabs.svelte';
import {
  type BandReleaseFilterCategory,
  type BandReleaseFilterMode,
  type BandReleaseFilterSelection,
  createBandReleasePredicate,
  isBandReleaseFilterRoot,
} from './bandReleaseFilters';
import {
  isSectionItemSelected,
  type SectionNavigation,
} from './sectionNavigation';

let {
  treeData,
  about,
  fallbackLocation,
  bandUrl,
  initialSelectedHref,
  loading = false,
  error = '',
  navigationInFilter = false,
  onNavigationChange,
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
  onNavigationChange?: (navigation: SectionNavigation | undefined) => void;
  leadingActions?: Snippet;
  trailingActions?: Snippet;
} = $props();
let content = $state<HTMLDivElement>();
let verticalNavigation = $state(false);
let compactActions = $state(false);

$effect(() => {
  const element = content;
  if (!element) return;
  const measure = () => {
    const width = element.clientWidth;
    verticalNavigation = width >= 640;
    compactActions = width < 480;
  };
  const observer = new ResizeObserver(measure);
  observer.observe(element);
  measure();
  return () => observer.disconnect();
});

let catalogNavigation = $state<SectionNavigation>();
const viewActions = $derived(
  catalogNavigation?.items.map(
    ({ id, label, count, image, title, contentId }) => ({
      id,
      label:
        id === 'band-about' ? (bandAbout?.aboutProfile?.name ?? 'Band') : label,
      count,
      keepLabelWhenCompact: id === 'band-about' || label === 'Releases',
      image:
        id === 'band-about'
          ? (bandAbout?.aboutProfile?.image ?? ICON_DISC)
          : (image ?? ICON_MENU),
      title,
      contentId,
    }),
  ) ?? [],
);
const selectedView = $derived.by(() => {
  const navigation = catalogNavigation;
  if (!navigation) return '';
  return (
    navigation.items.find((item) =>
      isSectionItemSelected(item, navigation.value),
    )?.id ?? ''
  );
});

function updateNavigation(navigation: SectionNavigation | undefined) {
  catalogNavigation = navigation;
  onNavigationChange?.(navigation);
}

function selectView(id: string) {
  const item = catalogNavigation?.items.find((item) => item.id === id);
  catalogNavigation?.select(item?.onSortChange ? id : (item?.sortValue ?? id));
}

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
let filterPaneOpen = $state(false);
let filterCategory = $state<BandReleaseFilterCategory>('Artists');
let filterMode = $state<BandReleaseFilterMode>('multiple');
let filterValueQuery = $state('');
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
  filterPaneOpen = false;
  filterCategory = 'Artists';
  filterMode = 'multiple';
  filterValueQuery = '';
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
  <button type="button" class="bcx-section-tab release-filters-trigger" aria-expanded={filterPaneOpen} aria-label={selections.length ? `Filters, ${selections.length} selected` : 'Filters'} onclick={() => { filterPaneOpen = !filterPaneOpen; }}>
    <ListFilter size={14} aria-hidden="true" />
    Filters{selections.length ? ` (${selections.length})` : ''}
  </button>
{/snippet}

{#snippet releaseFilterPane()}
  <BcxBandReleaseFilters roots={filterRoots} bind:category={filterCategory} bind:query={filterValueQuery} mode={filterMode} onModeChange={setFilterMode} {selections} applying={applyingFilters} applyFailed={filterApplyFailed} onToggle={toggleFilter} onClear={() => { selections = []; }} onRetry={() => { filterRetry += 1; }} />
{/snippet}

<div class="band-panel">
  {#if leadingActions || trailingActions}
    <div class="band-actions">
      {@render leadingActions?.()}
      {#if trailingActions}<div class="band-trailing-actions">{@render trailingActions()}</div>{/if}
    </div>
  {/if}
  <div bind:this={content} class="band-content" class:vertical-navigation={verticalNavigation}>
    {#if viewActions.length}
      <BcxSectionTabs tabs={viewActions} value={selectedView} label="Band catalog sections" onValueChange={selectView} navigationActions={bandAbout ? bandActions : undefined} compactWhenOverflowing={true} hideCountsWhenOverflowing={true} vertical={verticalNavigation} />
    {/if}
    <div class="band-catalog">
      <BcxRootSectionTabs treeData={catalog} label="Band catalog sections" defaultRootPath={releasesPath} {initialSelectedHref} {aboutContent} sortInToolbar={true} countBadges={true} {navigationInFilter} releaseFilterActions={true} {releaseItemFilter} releaseFilterControls={hasReleases && filterRoots.length ? releaseFilterControls : undefined} releaseFilterPane={filterPaneOpen ? releaseFilterPane : undefined} showFilterNavigation={!navigationInFilter} onNavigationChange={updateNavigation} />
    </div>
  </div>
</div>

<style>
.band-panel, .band-content, .band-catalog { display: flex; flex: 1 1 0%; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; }
.band-content.vertical-navigation { flex-direction: row; }
.vertical-navigation > :global(.bcx-section-tabs) { margin-left: var(--bcx-preview-gutter, 16px); margin-right: var(--bcx-preview-column-gap, 12px); }
.band-actions { display: flex; align-items: flex-start; flex-shrink: 0; padding: 4px var(--bcx-preview-gutter, 16px); }
.band-trailing-actions { display: flex; flex-shrink: 0; margin-left: auto; }
.bcx-section-tab.release-filters-trigger { flex: none; min-height: 36px; gap: 0.375rem; padding: 6px 8px; border: 1px solid #4b5563; background: #374151; }
.release-filters-trigger[aria-expanded='true'] { border-color: #38bdf8; }
</style>
