<script lang="ts">
import { Tabs } from 'bits-ui';
import type { TreeData } from 'src/features/treeview/TreeData';
import BcxSectionTabs from './BcxSectionTabs.svelte';
import BcxTreeBrowser from './BcxTreeBrowser.svelte';
import { createRootSectionTabs } from './rootSectionTabs';

let { treeData, label }: { treeData: TreeData; label: string } = $props();
const tabs = $derived(createRootSectionTabs(treeData.items));
let selectedRoot = $state('');
let visitedRoots: Record<string, boolean> = $state({});

$effect(() => {
  if (!tabs.some((tab) => tab.id === selectedRoot)) {
    selectedRoot = tabs[0]?.id ?? '';
  }
  if (selectedRoot) visitedRoots[selectedRoot] = true;
});
</script>

{#if tabs.length}
  <Tabs.Root bind:value={selectedRoot}>
    <BcxSectionTabs {tabs} bind:value={selectedRoot} {label} />
    {#each tabs as tab (tab.id)}
      <Tabs.Content value={tab.id}>
        {#if visitedRoots[tab.id]}
          <div class="bcx-section-tree-browser">
            <BcxTreeBrowser
              {treeData}
              initialRootPath={tab.id}
              lockInitialRoot={true}
              showBreadcrumb={false}
            />
          </div>
        {/if}
      </Tabs.Content>
    {/each}
  </Tabs.Root>
{:else}
  <BcxTreeBrowser {treeData} />
{/if}
