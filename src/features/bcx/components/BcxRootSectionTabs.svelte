<script lang="ts">
import { Tabs } from 'bits-ui';
import type { TreeData } from 'src/features/treeview/TreeData';
import type { TreeItem } from 'src/features/treeview/TreeItem';
import type { Snippet } from 'svelte';
import BcxBandDetails from './BcxBandDetails.svelte';
import BcxSectionTabs from './BcxSectionTabs.svelte';
import BcxTreeBrowser from './BcxTreeBrowser.svelte';
import {
  type CatalogGroupSort,
  type CatalogYearSort,
  createRootSectionTabs,
  type FollowingBandCountrySort,
  type FollowingBandYearSort,
  sortCatalogGroups,
  sortFollowingBandGroups,
} from './rootSectionTabs';

const tabDescriptions: Record<string, { label?: string; title: string }> = {
  'Release Info': { title: 'View release information, artwork, and notes.' },
  Credits: { title: 'View release credits and contributors.' },
  'Related releases': {
    title:
      'Browse locally saved releases by this release’s artists across Bandcamp.',
  },
  All: { title: 'Browse all items in this section.' },
  Artists: { title: 'Browse releases grouped by artist.' },
  Releases: { title: 'Browse releases in this section.' },
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
  'Latest added': {
    title: 'Browse followed bands, most recently followed first.',
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
  },
  'No longer listed': {
    title: 'Browse saved items missing from the latest Bandcamp sync.',
  },
  'No longer followed': {
    title: 'Browse genres you no longer follow.',
  },
};

let {
  treeData,
  label,
  initialSelectedHref,
  sortBands = false,
  aboutContent,
  sectionContent,
  actions,
  responsiveSidebar = false,
}: {
  treeData: TreeData;
  label: string;
  initialSelectedHref?: string;
  sortBands?: boolean;
  aboutContent?: Snippet<[TreeItem]>;
  sectionContent?: Snippet<[TreeItem]>;
  actions?: Snippet;
  responsiveSidebar?: boolean;
} = $props();
let container = $state<HTMLDivElement | null>(null);
let containerWidth = $state(0);
const orientation = $derived(
  responsiveSidebar && containerWidth >= 640 ? 'vertical' : 'horizontal',
);

$effect(() => {
  const element = container;
  if (!responsiveSidebar || !element) return;
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
      ? sortCatalogGroups(treeData, artistSort, releaseYearSort, addedYearSort)
      : treeData;
});
const tabs = $derived.by(() => {
  return createRootSectionTabs(displayedTreeData.items);
});
const displayTabs = $derived.by(() => {
  const labeledTabs = tabs.map((tab) => {
    const rootLabel = displayedTreeData.items.find(
      (item) => item.path === tab.id,
    )?.label;
    const description = rootLabel ? tabDescriptions[rootLabel] : undefined;
    const labeledTab = {
      ...tab,
      label: description?.label
        ? tab.label.replace(rootLabel ?? '', description.label)
        : tab.label,
      title:
        description?.title ??
        (rootLabel?.startsWith('About')
          ? 'View artist or label information and links.'
          : `Open ${rootLabel ?? 'section'}.`),
    };
    if (isReleaseCatalog && rootLabel === 'Artists') {
      return {
        ...labeledTab,
        sortValue: artistSort,
        sortLabel: 'Sort artists',
        onSortChange: setArtistSort,
        sortOptions: [
          {
            id: 'az',
            label: 'A–Z',
            title: 'Show artists in alphabetical order.',
          },
          {
            id: 'za',
            label: 'Z–A',
            title: 'Show artists in reverse alphabetical order.',
          },
          {
            id: 'most-releases',
            label: 'Most releases',
            title: 'Show artists with the most releases first.',
          },
          {
            id: 'fewest-releases',
            label: 'Fewest releases',
            title: 'Show artists with the fewest releases first.',
          },
        ],
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
        sortOptions: [
          {
            id: 'newest',
            label: 'Newest first',
            title: 'Show the newest years first.',
          },
          {
            id: 'oldest',
            label: 'Oldest first',
            title: 'Show the oldest years first.',
          },
          {
            id: 'most-releases',
            label: 'Most releases',
            title: 'Show years with the most releases first.',
          },
          {
            id: 'fewest-releases',
            label: 'Fewest releases',
            title: 'Show years with the fewest releases first.',
          },
        ],
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
      ? [{ ...tab, label: count ? `Bands (${count})` : 'Bands', sortOptions }]
      : sortIds.has(tab.id)
        ? []
        : [tab],
  );
});
let selectedRoot = $state('');
let visitedRoots: Record<string, boolean> = $state({});

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

$effect(() => {
  if (!tabs.some((tab) => tab.id === selectedRoot)) {
    selectedRoot = tabs[0]?.id ?? '';
  }
  if (selectedRoot) visitedRoots[selectedRoot] = true;
});

function refreshTabs() {
  rootVersion += 1;
}
</script>

{#if tabs.length}
  <Tabs.Root bind:ref={container} bind:value={selectedRoot} {orientation} class="bcx-panel-body bcx-root-sections">
    <BcxSectionTabs tabs={displayTabs} bind:value={selectedRoot} {label} {actions} vertical={orientation === 'vertical'} />
    {#each tabs as tab (tab.id)}
      <Tabs.Content value={tab.id} class="bcx-tab-content">
        {#if visitedRoots[tab.id]}
          {@const root = displayedTreeData.items.find((item) => item.path === tab.id)}
          <div class="bcx-section-tree-browser">
            {#if root && sectionContent}
              {@render sectionContent(root)}
            {:else}
            {@const about = displayedTreeData.items.find((item) => item.path === tab.id)}
            {#if about?.aboutProfile}
              <div class="item-preview-panel-content about-content">
                {#if aboutContent}
                  {@render aboutContent(about)}
                {:else}
                  <BcxBandDetails {about} />
                {/if}
              </div>
            {:else}
              <BcxTreeBrowser
                treeData={displayedTreeData}
                initialRootPath={tab.id}
                lockInitialRoot={true}
                showBreadcrumb={false}
                initialSelectedHref={initialSelectedHref ?? root?.initialSelectedHref}
                onRootLoaded={refreshTabs}
                nativeTabNavigation={true}
              />
            {/if}
            {/if}
          </div>
        {/if}
      </Tabs.Content>
    {/each}
  </Tabs.Root>
{:else}
  <BcxTreeBrowser {treeData} />
{/if}

<style>
:global(.bcx-panel-body.bcx-root-sections[data-orientation='vertical']) { flex-direction: row; }
.about-content { display: flex; flex: 1 1 0%; flex-direction: column; min-height: 0; overflow-y: auto; }
</style>
