<script lang="ts">
import { Tabs } from 'bits-ui';
import type { TreeData } from 'src/features/treeview/TreeData';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import {
  ICON_HEADPHONES,
  ICON_HISTORY,
  ICON_INFO,
  ICON_MENU,
} from 'src/features/treeview/utils/icon';
import { type Snippet, tick } from 'svelte';
import BcxArtistsPanel from './BcxArtistsPanel.svelte';
import BcxBandDetails from './BcxBandDetails.svelte';
import BcxCatalogSplitLayout from './BcxCatalogSplitLayout.svelte';
import BcxCatalogSplitPanel from './BcxCatalogSplitPanel.svelte';
import BcxSectionFilter from './BcxSectionFilter.svelte';
import BcxSectionSort from './BcxSectionSort.svelte';
import BcxSectionTabs from './BcxSectionTabs.svelte';
import BcxTreeBrowser from './BcxTreeBrowser.svelte';
import {
  type CatalogGroupSort,
  type CatalogPriceSort,
  type CatalogYearSort,
  catalogPriceSortOptions,
  catalogYearSortOptions,
  createCatalogGroupSortOptions,
  createRootSectionTabs,
  type FollowingBandCountrySort,
  type FollowingBandYearSort,
  sortCatalogGroups,
  sortFollowingBandGroups,
} from './rootSectionTabs';
import {
  isSectionItemSelected,
  type SectionNavigationItem,
} from './sectionNavigation';

type SectionTab = Omit<SectionNavigationItem, 'contentId'>;

const artistSortOptions = createCatalogGroupSortOptions('artists');

const splitSections: Readonly<
  Record<
    string,
    { groupLabel: string; itemLabel?: string; emptyMessage: string }
  >
> = {
  Tags: {
    groupLabel: 'Tags',
    emptyMessage: 'Select a tag to see its releases.',
  },
  'Release years': {
    groupLabel: 'Years',
    emptyMessage: 'Select a year to see its releases.',
  },
  'Added years': {
    groupLabel: 'Years added',
    emptyMessage: 'Select a year to see the releases added that year.',
  },
  'By Prices': {
    groupLabel: 'Prices',
    emptyMessage: 'Select a price to see its releases.',
  },
  'Followed by Year': {
    groupLabel: 'Years followed',
    itemLabel: 'Followed bands',
    emptyMessage: 'Select a year to see the bands you followed that year.',
  },
  Countries: {
    groupLabel: 'Countries',
    itemLabel: 'Followed bands',
    emptyMessage: 'Select a country to see its bands.',
  },
};

const tabDescriptions: Record<
  string,
  { label?: string; title: string; image?: string; emptyMessage?: string }
> = {
  'Release Info': { title: 'View release information, artwork, and notes.' },
  Credits: { title: 'View release credits and contributors.' },
  All: { title: 'Browse all items in this section.', image: ICON_MENU },
  Artists: { title: 'Browse releases grouped by artist.' },
  Releases: { title: 'Browse releases in this section.' },
  Upcoming: {
    title: 'Browse saved releases with a future release date.',
    emptyMessage: 'No upcoming releases in your saved library.',
  },
  'Recently Released': {
    title: 'Browse saved releases dated within the last 30 calendar days.',
    emptyMessage: 'No saved releases in the last 30 calendar days.',
  },
  'Releases: Reverse': { title: 'Browse releases in reverse catalog order.' },
  'Releases: Title A–Z': { title: 'Browse releases by title, A to Z.' },
  'Releases: Title Z–A': { title: 'Browse releases by title, Z to A.' },
  Bands: { title: 'Browse bands in this section.' },
  Tracks: { title: 'Browse tracks in this section.' },
  'Release years': {
    label: 'By Release Year',
    title: 'Browse releases grouped by release year.',
  },
  'Added years': {
    label: 'By Year Added',
    title: 'Browse releases grouped by the year they were added to this list.',
  },
  'By Prices': {
    title: 'Browse releases grouped by saved price and currency.',
  },
  'Latest added': {
    title: 'Browse followed bands, most recently followed first.',
    image: ICON_HEADPHONES,
  },
  'Earliest followed': {
    title: 'Browse followed bands, earliest followed first.',
  },
  'A–Z': { title: 'Browse followed bands by name, A to Z.' },
  'Z–A': { title: 'Browse followed bands by name, Z to A.' },
  'Followed by Year': {
    label: 'By Year',
    title: 'Browse bands grouped by the year you followed them.',
  },
  Countries: {
    label: 'By Country',
    title: 'Browse followed bands grouped by country.',
  },
  Tags: { title: 'Browse releases grouped by tag.' },
  Unavailable: {
    title: 'Browse saved items whose Bandcamp pages are unavailable.',
    image: ICON_INFO,
  },
  'No longer listed': {
    title: 'Browse saved items missing from the latest Bandcamp sync.',
    image: ICON_HISTORY,
  },
  'No longer followed': {
    title: 'Browse genres you no longer follow.',
    image: ICON_HISTORY,
  },
};

let {
  treeData,
  label,
  initialSelectedHref,
  defaultRootPath,
  sortBands = false,
  aboutContent,
  sectionContent,
  sectionLabels,
  actions,
  navigationActions,
  heading,
  responsiveSidebar = false,
  compactWhenOverflowing = false,
  countBadges = false,
  navigationInFilter = false,
  navigationInToolbar = false,
  releaseFilterActions = false,
  releaseFilterControls,
  releaseFilterPane,
  releaseItemFilter,
  splitCatalogGroups = false,
}: {
  treeData: TreeData;
  releaseFilterActions?: boolean;
  releaseFilterControls?: Snippet;
  releaseFilterPane?: Snippet;
  releaseItemFilter?: (item: TreeItem) => boolean;
  splitCatalogGroups?: boolean;
  label: string;
  initialSelectedHref?: string;
  defaultRootPath?: string;
  sortBands?: boolean;
  aboutContent?: Snippet<[TreeItem]>;
  sectionContent?: Snippet<[TreeItem]>;
  sectionLabels?: Readonly<Record<string, string>>;
  actions?: Snippet;
  navigationActions?: Snippet;
  heading?: Snippet;
  responsiveSidebar?: boolean;
  compactWhenOverflowing?: boolean;
  countBadges?: boolean;
  navigationInFilter?: boolean;
  navigationInToolbar?: boolean;
} = $props();
const contentId = $props.id();
const toolbarSorting = $derived(navigationInFilter || navigationInToolbar);
let container = $state<HTMLDivElement | null>(null);
let containerWidth = $state(0);
const orientation = $derived(
  responsiveSidebar && containerWidth >= 640 ? 'vertical' : 'horizontal',
);

$effect(() => {
  const element = container;
  if (
    (navigationInFilter && !navigationInToolbar) ||
    !responsiveSidebar ||
    !element
  )
    return;
  const measure = () => {
    containerWidth = element.clientWidth;
  };
  const observer = new ResizeObserver(measure);
  observer.observe(element);
  measure();
  return () => observer.disconnect();
});

let rootVersion = $state(0);
let yearSort = $state<FollowingBandYearSort>('newest');
let countrySort = $state<FollowingBandCountrySort>('az');
let artistSort = $state<CatalogGroupSort>('az');
let releaseYearSort = $state<CatalogYearSort>('newest');
let addedYearSort = $state<CatalogYearSort>('newest');
let priceSort = $state<CatalogPriceSort>('low-to-high');
const isReleaseCatalog = $derived(
  treeData.items.some(
    (item) => item.releasePreview && item.label === 'Releases',
  ),
);
const displayedTreeData = $derived.by(() => {
  rootVersion;
  return sortBands
    ? sortFollowingBandGroups(treeData, yearSort, countrySort)
    : isReleaseCatalog
      ? sortCatalogGroups(
          treeData,
          artistSort,
          releaseYearSort,
          addedYearSort,
          priceSort,
        )
      : treeData;
});
const tabs = $derived.by(() => {
  return createRootSectionTabs(displayedTreeData.items, countBadges);
});
const displayTabs = $derived.by<SectionTab[]>(() => {
  const labeledTabs = tabs.map((tab) => {
    const root = displayedTreeData.items.find((item) => item.path === tab.id);
    const rootLabel = root?.label;
    const description = rootLabel ? tabDescriptions[rootLabel] : undefined;
    const sectionLabel = sectionLabels?.[root?.pathKey ?? tab.id];
    const title =
      description?.title ??
      (rootLabel?.startsWith('About')
        ? 'View artist or label information and links.'
        : `Open ${rootLabel ?? 'section'}.`);
    const labeledTab = {
      ...tab,
      image: tab.image ?? description?.image,
      label:
        sectionLabel ??
        (description?.label
          ? tab.label.replace(rootLabel ?? '', description.label)
          : tab.label),
      title: sectionLabel ? `${sectionLabel}\n${title}` : title,
    };
    if (isReleaseCatalog && rootLabel === 'Artists') {
      return {
        ...labeledTab,
        sortValue: artistSort,
        sortLabel: 'Sort artists',
        onSortChange: setArtistSort,
        sortOptions: artistSortOptions,
      };
    }
    if (
      isReleaseCatalog &&
      (rootLabel === 'Release years' || rootLabel === 'Added years')
    ) {
      return {
        ...labeledTab,
        sortValue:
          rootLabel === 'Release years' ? releaseYearSort : addedYearSort,
        sortLabel:
          rootLabel === 'Release years'
            ? 'Sort release years'
            : 'Sort years added',
        onSortChange:
          rootLabel === 'Release years' ? setReleaseYearSort : setAddedYearSort,
        sortOptions: catalogYearSortOptions,
      };
    }
    if (splitCatalogGroups && isReleaseCatalog && rootLabel === 'By Prices') {
      return {
        ...labeledTab,
        sortValue: priceSort,
        sortLabel: 'Sort prices',
        onSortChange: setPriceSort,
        sortOptions: catalogPriceSortOptions,
      };
    }
    if (!sortBands) return labeledTab;
    if (rootLabel === 'Followed by Year') {
      return {
        ...labeledTab,
        sortValue: yearSort,
        sortLabel: 'Sort followed years',
        onSortChange: setYearSort,
        sortOptions: [
          {
            id: 'newest',
            label: 'Newest first',
            title: 'Show the most recently followed years first.',
          },
          {
            id: 'oldest',
            label: 'Oldest first',
            title: 'Show the earliest followed years first.',
          },
          {
            id: 'most-bands',
            label: 'Most bands',
            title: 'Show years with the most followed bands first.',
          },
          {
            id: 'fewest-bands',
            label: 'Fewest bands',
            title: 'Show years with the fewest followed bands first.',
          },
        ],
      };
    }
    if (rootLabel === 'Countries') {
      return {
        ...labeledTab,
        sortValue: countrySort,
        sortLabel: 'Sort countries',
        onSortChange: setCountrySort,
        sortOptions: [
          {
            id: 'az',
            label: 'A–Z',
            title: 'Show countries in alphabetical order.',
          },
          {
            id: 'za',
            label: 'Z–A',
            title: 'Show countries in reverse alphabetical order.',
          },
          {
            id: 'most-bands',
            label: 'Most bands',
            title: 'Show countries with the most followed bands first.',
          },
          {
            id: 'fewest-bands',
            label: 'Fewest bands',
            title: 'Show countries with the fewest followed bands first.',
          },
        ],
      };
    }
    return labeledTab;
  });
  if (isReleaseCatalog) {
    const sortRoots = [
      'Releases',
      'Releases: Reverse',
      'Releases: Title A–Z',
      'Releases: Title Z–A',
    ].map((name) =>
      displayedTreeData.items.find((item) => item.label === name),
    );
    if (sortRoots.some((root) => !root?.path)) return labeledTabs;
    const optionLabels = [
      'Catalog order',
      'Reverse order',
      'Title A–Z',
      'Title Z–A',
    ];
    const sortOptions = sortRoots.map((root, index) => ({
      id: root?.path ?? '',
      label: optionLabels[index],
      title: root?.label ? tabDescriptions[root.label]?.title : undefined,
    }));
    const sortIds = new Set(sortOptions.map((option) => option.id));
    return labeledTabs.flatMap((tab) =>
      tab.id === sortOptions[0].id
        ? [{ ...tab, sortLabel: 'Sort releases', sortOptions }]
        : sortIds.has(tab.id)
          ? []
          : [tab],
    );
  }
  if (!sortBands) return labeledTabs;

  const sortRoots = ['Latest added', 'Earliest followed', 'A–Z', 'Z–A'].map(
    (name) => displayedTreeData.items.find((item) => item.label === name),
  );
  if (sortRoots.some((root) => !root?.path)) return labeledTabs;

  const sortOptions = sortRoots.map((root) => ({
    id: root?.path ?? '',
    label: root?.label ?? '',
    title: root?.label ? tabDescriptions[root.label]?.title : undefined,
  }));
  const latest = sortRoots[0];
  const count = latest?.childrenCount ?? latest?.children?.length ?? 0;
  const sortIds = new Set(sortOptions.map((option) => option.id));

  return labeledTabs.flatMap((tab) =>
    tab.id === sortOptions[0].id
      ? [
          {
            ...tab,
            label: count && !countBadges ? `Bands (${count})` : 'Bands',
            sortLabel: 'Sort followed bands',
            sortOptions,
          },
        ]
      : sortIds.has(tab.id)
        ? []
        : [tab],
  );
});
let selectedRoot = $state('');
let lastRootSort = $state('');
let focusControlOnClose: string | null = null;
let visitedRoots: Record<string, boolean> = $state({});
let filterQueryById: Record<string, string> = $state({});
let sharedFilterQuery = $state('');
const navigationItems = $derived(
  displayTabs.map((tab) => {
    const sortValue =
      tab.sortValue ??
      tab.sortOptions?.find((option) => option.id === lastRootSort)?.id ??
      tab.sortOptions?.[0]?.id;
    return {
      ...tab,
      sortValue,
      contentId: `${contentId}-${tab.sortOptions && !tab.onSortChange ? (sortValue ?? tab.id) : tab.id}`,
    };
  }),
);
const localNavigationTabs = $derived(
  toolbarSorting
    ? navigationItems.map((item, index) => ({
        id: item.onSortChange ? item.id : (item.sortValue ?? item.id),
        label: item.label,
        count: item.count,
        image: item.image,
        title: item.title,
        contentId: item.contentId,
        keepLabelWhenCompact: navigationInToolbar && index < 3,
        compactLabel:
          navigationInToolbar && item.label === 'By Release Year'
            ? 'Years'
            : undefined,
      }))
    : displayTabs,
);

function setYearSort(id: string) {
  if (
    id === 'newest' ||
    id === 'oldest' ||
    id === 'most-bands' ||
    id === 'fewest-bands'
  )
    yearSort = id;
}

function setCountrySort(id: string) {
  if (
    id === 'az' ||
    id === 'za' ||
    id === 'most-bands' ||
    id === 'fewest-bands'
  )
    countrySort = id;
}

function isCatalogGroupSort(id: string): id is CatalogGroupSort {
  return (
    id === 'az' ||
    id === 'za' ||
    id === 'most-releases' ||
    id === 'fewest-releases'
  );
}

function isCatalogYearSort(id: string): id is CatalogYearSort {
  return (
    id === 'newest' ||
    id === 'oldest' ||
    id === 'most-releases' ||
    id === 'fewest-releases'
  );
}

function setArtistSort(id: string) {
  if (isCatalogGroupSort(id)) artistSort = id;
}

function setReleaseYearSort(id: string) {
  if (isCatalogYearSort(id)) releaseYearSort = id;
}

function setAddedYearSort(id: string) {
  if (isCatalogYearSort(id)) addedYearSort = id;
}

function setPriceSort(id: string) {
  if (id === 'low-to-high' || id === 'high-to-low') priceSort = id;
}

$effect(() => {
  if (!tabs.some((tab) => tab.id === selectedRoot)) {
    const defaultTab = tabs.find((tab) => tab.id === defaultRootPath);
    selectedRoot = defaultTab?.id ?? tabs[0]?.id ?? '';
  }
  if (selectedRoot) visitedRoots[selectedRoot] = true;
});

function refreshTabs() {
  rootVersion += 1;
}

function selectSidebarRoot(id: string) {
  selectedRoot = id;
}

function selectSortOption(item: SectionNavigationItem, id: string) {
  focusControlOnClose = '[data-bcx-section-sort]';
  item.onSortChange?.(id);
  selectedRoot = item.onSortChange ? item.id : id;
}

function selectFilterRoot(id: string) {
  focusControlOnClose = '[data-bcx-section-filter]';
  const item = navigationItems.find((item) => item.id === id);
  selectedRoot = item?.onSortChange ? item.id : (item?.sortValue ?? id);
}

async function handleControlCloseAutoFocus(event: Event) {
  if (!focusControlOnClose) return;
  event.preventDefault();
  const selector = focusControlOnClose;
  focusControlOnClose = null;
  await tick();
  if (container?.closest('[hidden]')) return;
  container
    ?.querySelector<HTMLButtonElement>(
      `:scope > .bcx-tab-content:not([hidden]) ${selector}`,
    )
    ?.focus();
}

$effect(() => {
  if (
    displayTabs.some(
      (tab) =>
        !tab.onSortChange &&
        tab.sortOptions?.some((option) => option.id === selectedRoot),
    )
  ) {
    lastRootSort = selectedRoot;
  }
});
</script>

{#snippet rootContent(tabId: string)}
        {#if visitedRoots[tabId]}
          {@const root = displayedTreeData.items.find((item) => item.path === tabId)}
          {@const isReleaseRoot = root?.label === 'Releases' || !!root?.label?.startsWith('Releases: ')}
          {@const hasReleaseControls = !!root?.releasePreview && isReleaseRoot && !!releaseFilterControls}
          {@const splitSection = root?.label && ((splitCatalogGroups && root.releasePreview) || (sortBands && root.itemPreview)) ? splitSections[root.label] : undefined}
          {@const navigationItem = navigationItems.find((item) => isSectionItemSelected(item, tabId))}
          {#snippet filterControls()}
            {#if navigationInFilter && !navigationInToolbar}
              <BcxSectionFilter items={navigationItems} {label} value={selectedRoot} onValueChange={selectFilterRoot} onCloseAutoFocus={handleControlCloseAutoFocus} />
            {/if}
            {#if hasReleaseControls}
              {@render releaseFilterControls?.()}
            {/if}
            {#if toolbarSorting && navigationItem?.sortOptions?.length}
              <BcxSectionSort item={navigationItem} iconOnly={!!splitSection || (splitCatalogGroups && !!root?.releasePreview && root.label === 'Artists')} onValueChange={(id) => selectSortOption(navigationItem, id)} onCloseAutoFocus={handleControlCloseAutoFocus} />
            {/if}
          {/snippet}
          <div class="bcx-section-tree-browser" class:release-catalog-results={releaseFilterActions && isReleaseRoot}>
            {#if navigationInFilter && (root?.aboutProfile || sectionContent) && (!navigationInToolbar || navigationItem?.sortOptions?.length)}
              <div class="bcx-section-view-toolbar">{@render filterControls()}</div>
            {/if}
            {#if root && sectionContent}
              {@render sectionContent(root)}
            {:else}
            {@const about = displayedTreeData.items.find((item) => item.path === tabId)}
            {#if about?.aboutProfile}
              <div class="item-preview-panel-content about-content">
                {#if aboutContent}
                  {@render aboutContent(about)}
                {:else}
                  <BcxBandDetails {about} />
                {/if}
              </div>
            {:else if root?.releasePreview && root.label === 'Artists'}
              <BcxArtistsPanel
                root={treeData.items.find((item) => item.path === tabId) ?? root}
                catalog={true}
                splitView={splitCatalogGroups}
                catalogSort={artistSort}
                filterActions={filterControls}
                bind:filterQuery={() => navigationInFilter ? sharedFilterQuery : navigationItem ? filterQueryById[navigationItem.id] ?? '' : null, (query) => { if (navigationInFilter) sharedFilterQuery = query ?? ''; else if (navigationItem) filterQueryById[navigationItem.id] = query ?? ''; }}
              />
            {:else}
              {#snippet sectionBrowser(onActivateNode: ((item: TreeItem) => void) | undefined, activeNodePath: string | undefined)}
                <BcxTreeBrowser
                  treeData={displayedTreeData}
                  initialRootPath={tabId}
                  lockInitialRoot={true}
                  showBreadcrumb={false}
                  initialSelectedHref={initialSelectedHref ?? root?.initialSelectedHref}
                  onRootLoaded={refreshTabs}
                  emptyMessage={root?.label ? tabDescriptions[root.label]?.emptyMessage : undefined}
                  nativeTabNavigation={true}
                  {onActivateNode}
                  {activeNodePath}
                  filterActions={hasReleaseControls || navigationInFilter || (toolbarSorting && navigationItem?.sortOptions?.length) ? filterControls : undefined}
                  enableReleaseFilterActions={releaseFilterActions && isReleaseRoot}
                  itemFilter={isReleaseRoot ? releaseItemFilter : undefined}
                  bind:filterQuery={() => navigationInFilter ? sharedFilterQuery : toolbarSorting && navigationItem ? filterQueryById[navigationItem.id] ?? '' : null, (query) => { if (navigationInFilter) sharedFilterQuery = query ?? ''; else if (navigationItem) filterQueryById[navigationItem.id] = query ?? ''; }}
                />
              {/snippet}
              {#if splitSection && root}
                <BcxCatalogSplitPanel
                  root={treeData.items.find((item) => item.path === tabId) ?? root}
                  {...splitSection}
                  groups={sectionBrowser}
                />
              {:else if hasReleaseControls}
                <BcxCatalogSplitLayout groupLabel="Release filters" itemLabel="Release results" groups={selectedRoot === tabId ? releaseFilterPane : undefined}>
                  {@render sectionBrowser(undefined, undefined)}
                </BcxCatalogSplitLayout>
              {:else}
                {@render sectionBrowser(undefined, undefined)}
              {/if}
            {/if}
            {/if}
          </div>
        {/if}
{/snippet}

{#if tabs.length && (navigationInFilter || navigationInToolbar)}
  <div bind:this={container} class="bcx-panel-body bcx-root-sections" class:has-heading={!!heading} class:stacked-heading={!!heading && responsiveSidebar && orientation === 'horizontal' && containerWidth <= 480} data-navigation={navigationInToolbar ? 'toolbar' : navigationInFilter ? 'filter' : 'sidebar'} data-orientation={navigationInToolbar ? orientation : undefined}>
    {#if heading}
      <div class="bcx-root-section-heading">{@render heading()}</div>
    {/if}
    {#if navigationInToolbar}
      <div class="bcx-root-section-navigation">
        <BcxSectionTabs tabs={localNavigationTabs} value={selectedRoot} {label} {actions} {navigationActions} onValueChange={selectSidebarRoot} {compactWhenOverflowing} hideCountsWhenOverflowing={true} vertical={orientation === 'vertical'} />
      </div>
    {:else if actions}
      <BcxSectionTabs tabs={[]} value="" {label} {actions} />
    {/if}
    {#each tabs as tab (tab.id)}
      <div id={`${contentId}-${tab.id}`} role="region" aria-label={tab.label} hidden={selectedRoot !== tab.id} class="bcx-tab-content">
        {@render rootContent(tab.id)}
      </div>
    {/each}
  </div>
{:else if tabs.length}
  <Tabs.Root bind:ref={container} bind:value={selectedRoot} {orientation} class="bcx-panel-body bcx-root-sections">
    <BcxSectionTabs tabs={localNavigationTabs} bind:value={selectedRoot} {label} {actions} {navigationActions} {compactWhenOverflowing} vertical={orientation === 'vertical'} />
    {#each tabs as tab (tab.id)}
      <Tabs.Content value={tab.id} class="bcx-tab-content">{@render rootContent(tab.id)}</Tabs.Content>
    {/each}
  </Tabs.Root>
{:else}
  {#if heading}<div class="bcx-root-section-empty-heading">{@render heading()}</div>{/if}
  <BcxTreeBrowser {treeData} />
{/if}

<style>
.bcx-root-section-navigation { display: contents; }
.bcx-root-sections.has-heading {
  display: grid;
  grid-template-columns: fit-content(40%) minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
}
.bcx-root-section-heading {
  display: flex;
  align-items: center;
  min-width: 0;
  grid-column: 1;
  grid-row: 1;
  margin: 0 0 8px var(--bcx-preview-gutter, 8px);
}
.has-heading > .bcx-root-section-navigation {
  display: flex;
  min-height: 0;
  min-width: 0;
  grid-column: 2;
  grid-row: 1;
}
.has-heading > .bcx-root-section-navigation :global(.bcx-section-tabs) { flex: 1 1 0%; }
.has-heading > .bcx-tab-content { grid-column: 1 / -1; grid-row: 2; }
.bcx-root-sections.has-heading[data-orientation='vertical'] {
  grid-template-columns: calc(var(--bcx-preview-gutter, 8px) + var(--bcx-preview-column-width, 11rem) + var(--bcx-preview-column-gap, 8px)) minmax(0, 1fr);
}
.has-heading[data-orientation='vertical'] > .bcx-root-section-heading { grid-column: 1 / -1; margin-right: var(--bcx-preview-gutter, 8px); }
.has-heading[data-orientation='vertical'] > .bcx-root-section-navigation { grid-column: 1; grid-row: 2; }
.has-heading[data-orientation='vertical'] > .bcx-tab-content { grid-column: 2; }
.bcx-root-sections.has-heading.stacked-heading { grid-template-rows: auto auto minmax(0, 1fr); }
.has-heading.stacked-heading > .bcx-root-section-heading { grid-column: 1 / -1; margin-right: var(--bcx-preview-gutter, 8px); }
.has-heading.stacked-heading > .bcx-root-section-navigation { grid-column: 1 / -1; grid-row: 2; }
.has-heading.stacked-heading > .bcx-tab-content { grid-row: 3; }
.bcx-root-section-empty-heading { margin: 0 var(--bcx-preview-gutter, 8px) 8px; }

:global(.bcx-panel-body.bcx-root-sections[data-orientation='vertical']) { flex-direction: row; }
:global(.bcx-root-sections > .bcx-tab-content) { margin-right: var(--bcx-preview-gutter, 8px); margin-bottom: 8px; }
:global(.bcx-root-sections[data-orientation='horizontal'] > .bcx-tab-content) { margin-left: var(--bcx-preview-gutter, 8px); }
:global(.bcx-root-sections[data-navigation='sidebar'] > .bcx-tab-content) { margin-left: var(--bcx-preview-gutter, 8px); }
:global(.bcx-root-sections[data-navigation='filter'] > .bcx-tab-content) { margin-left: var(--bcx-preview-gutter, 8px); }
.bcx-section-view-toolbar { display: flex; flex: 0 0 auto; flex-wrap: wrap; gap: 8px; min-width: 0; margin-bottom: 8px; }
.release-catalog-results :global(.bcx-browser-toolbar) { container: release-catalog-toolbar / inline-size; }
@container release-catalog-toolbar (max-width: 27rem) {
  .release-catalog-results :global(.bcx-browser-filter) { flex-basis: 5rem; }
  .release-catalog-results :global(.bcx-section-tab.release-filters-trigger),
  .release-catalog-results :global(.bcx-section-tab.bcx-section-sort) {
    align-self: flex-start;
    flex: none;
    justify-content: center;
    width: 2rem;
    padding-inline: 0;
  }
  .release-catalog-results :global(.release-filters-label),
  .release-catalog-results :global(.bcx-section-sort-label),
  .release-catalog-results :global(.bcx-section-sort-chevron) { display: none; }
}
@container release-catalog-toolbar (max-width: 13rem) {
  .release-catalog-results :global(.bcx-tree-filter-field:has(.bcx-tree-filter-count):has(.bcx-tree-filter-clear)) { flex-wrap: wrap; }
  .release-catalog-results :global(.bcx-tree-filter-field:has(.bcx-tree-filter-count):has(.bcx-tree-filter-clear) .bcx-tree-filter-input) { flex-basis: 100%; }
}
.about-content { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; overflow-y: auto; }
</style>
