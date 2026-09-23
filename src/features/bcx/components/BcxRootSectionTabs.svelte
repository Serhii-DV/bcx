<script lang="ts">
import { Tabs } from 'bits-ui';
import type { TreeData } from 'src/features/treeview/TreeData';
import BcxBandDetails from './BcxBandDetails.svelte';
import BcxItemPreviewPanel from './BcxItemPreviewPanel.svelte';
import BcxSectionTabs from './BcxSectionTabs.svelte';
import BcxTreeBrowser from './BcxTreeBrowser.svelte';
import { createRootSectionTabs } from './rootSectionTabs';

let {
  treeData,
  label,
  initialSelectedHref,
}: {
  treeData: TreeData;
  label: string;
  initialSelectedHref?: string;
} = $props();
let rootVersion = $state(0);
const tabs = $derived.by(() => {
  rootVersion;
  return createRootSectionTabs(treeData.items);
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
    <BcxSectionTabs {tabs} bind:value={selectedRoot} {label} />
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
