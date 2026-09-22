<script lang="ts">
import { Tabs } from 'bits-ui';
import type { TreeData } from 'src/features/treeview/TreeData';
import BcxItemPreviewBrowser from './BcxItemPreviewBrowser.svelte';
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
              <BcxItemPreviewBrowser {treeData} rootPath={tab.id} {initialSelectedHref} onRootLoaded={refreshTabs} />
            {:else}
            {@const profile = treeData.items.find((item) => item.path === tab.id)?.aboutProfile}
            {#if profile}
              <header class="about-profile">
                {#if profile.image}
                  <img src={profile.image} alt={`${profile.name} profile`} onerror={(event) => event.currentTarget.setAttribute('hidden', '')} />
                {/if}
                <h3>{profile.name}</h3>
              </header>
            {/if}
            <BcxTreeBrowser
              {treeData}
              initialRootPath={tab.id}
              lockInitialRoot={true}
              showBreadcrumb={false}
              showFilter={!profile}
              {initialSelectedHref}
              onRootLoaded={refreshTabs}
            />
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
.about-profile { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; flex-shrink: 0; }
.about-profile img { width: 6rem; height: 6rem; object-fit: contain; border-radius: 0.25rem; }
.about-profile h3 { margin: 0; min-width: 0; font-size: 1rem; overflow-wrap: anywhere; }
</style>
