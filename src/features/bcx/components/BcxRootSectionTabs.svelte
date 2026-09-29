<script lang="ts">
import { Tabs } from 'bits-ui';
import type { TreeData } from 'src/features/treeview/TreeData';
import BcxBandDetails from './BcxBandDetails.svelte';
import BcxItemPreviewPanel from './BcxItemPreviewPanel.svelte';
import BcxSectionTabs from './BcxSectionTabs.svelte';
import BcxTreeBrowser from './BcxTreeBrowser.svelte';
import { createRootSectionTabs } from './rootSectionTabs';

const tabDescriptions: Record<string, { label?: string; title: string }> = {
  All: { title: 'Browse all items in this section.' },
  Artists: { title: 'Browse releases grouped by artist.' },
  Releases: { title: 'Browse releases in this section.' },
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
}: {
  treeData: TreeData;
  label: string;
  initialSelectedHref?: string;
  sortBands?: boolean;
} = $props();
let rootVersion = $state(0);
const tabs = $derived.by(() => {
  rootVersion;
  return createRootSectionTabs(treeData.items);
});
const displayTabs = $derived.by(() => {
  const labeledTabs = tabs.map((tab) => {
    const rootLabel = treeData.items.find(
      (item) => item.path === tab.id,
    )?.label;
    const description = rootLabel ? tabDescriptions[rootLabel] : undefined;
    return {
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
  });
  if (!sortBands) return labeledTabs;

  const sortRoots = ['Latest added', 'A–Z', 'Z–A'].map((name) =>
    treeData.items.find((item) => item.label === name),
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

$effect(() => {
  if (!tabs.some((tab) => tab.id === selectedRoot)) {
    selectedRoot = tabs[0]?.id ?? '';
  }
  if (selectedRoot) visitedRoots[selectedRoot] = true;
});

function usesItemPreview(path: string): boolean {
  const root = treeData.items.find((item) => item.path === path);
  return !!(root?.itemPreview || root?.releasePreview);
}

function refreshTabs() {
  rootVersion += 1;
}
</script>

{#if tabs.length}
  <Tabs.Root bind:value={selectedRoot} class="bcx-panel-body">
    <BcxSectionTabs tabs={displayTabs} bind:value={selectedRoot} {label} />
    {#each tabs as tab (tab.id)}
      <Tabs.Content value={tab.id} class="bcx-tab-content">
        {#if visitedRoots[tab.id]}
          <div class="bcx-section-tree-browser">
            {#if usesItemPreview(tab.id)}
              <BcxItemPreviewPanel {treeData} rootPath={tab.id} {initialSelectedHref} onRootLoaded={refreshTabs} />
            {:else}
            {@const about = treeData.items.find((item) => item.path === tab.id)}
            {#if about?.aboutProfile}
              <BcxBandDetails {about} />
            {:else}
              <BcxTreeBrowser
                {treeData}
                initialRootPath={tab.id}
                lockInitialRoot={true}
                showBreadcrumb={false}
                {initialSelectedHref}
                onRootLoaded={refreshTabs}
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
