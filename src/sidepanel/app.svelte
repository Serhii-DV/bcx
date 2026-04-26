<script lang="ts">
import type { TreeData } from 'src/app/treeview/TreeData';
import { onMount } from 'svelte';
import { BCXSidePanel } from '$lib/components/bcx';
import {
  type ActiveBandcampTab,
  createActiveTabTreeData,
  getActiveBandcampTab,
} from './activeTabTreeData';

let treeData: TreeData | null = $state(null);
let activeTab: ActiveBandcampTab | null = $state(null);
let errorMessage = $state('');
let isLoading = $state(true);

onMount(() => {
  loadTreeData();

  const handleActivated = () => {
    void loadTreeData();
  };
  const handleUpdated = (tabId: number, changeInfo: { url?: string }) => {
    if (
      tabId === activeTab?.id &&
      changeInfo.url &&
      shouldReloadForUrlChange(activeTab.url, changeInfo.url)
    ) {
      void loadTreeData();
    }
  };

  chrome.tabs.onActivated.addListener(handleActivated);
  chrome.tabs.onUpdated.addListener(handleUpdated);

  return () => {
    chrome.tabs.onActivated.removeListener(handleActivated);
    chrome.tabs.onUpdated.removeListener(handleUpdated);
  };
});

async function loadTreeData() {
  isLoading = true;
  errorMessage = '';

  try {
    const tab = await getActiveBandcampTab();
    activeTab = tab;

    if (!tab) {
      treeData = null;
      return;
    }

    treeData = await createActiveTabTreeData(tab);
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : 'Failed to load Music Explorer';
    treeData = null;
  } finally {
    isLoading = false;
  }
}

function shouldReloadForUrlChange(previousUrl: string, nextUrl: string) {
  try {
    const previous = new URL(previousUrl);
    const next = new URL(nextUrl);

    return (
      previous.origin !== next.origin ||
      previous.pathname !== next.pathname ||
      previous.hash !== next.hash
    );
  } catch {
    return previousUrl !== nextUrl;
  }
}
</script>

{#if treeData}
  <BCXSidePanel treeData={treeData} open={true} browserPanel={true} />
{:else}
  <main class="bcx-sidepanel-empty">
    <div class="bcx-sidepanel-empty-content">
      <h1>Music Explorer</h1>
      {#if isLoading}
        <p>Loading active Bandcamp tab...</p>
      {:else if errorMessage}
        <p>{errorMessage}</p>
      {:else}
        <p>Open a Bandcamp music or release page to use BCX.</p>
      {/if}
    </div>
  </main>
{/if}

<style>
  .bcx-sidepanel-empty {
    align-items: center;
    background: rgb(31 41 55);
    color: #f9fafb;
    display: flex;
    min-height: 100vh;
    padding: 24px;
  }

  .bcx-sidepanel-empty-content {
    display: grid;
    gap: 8px;
  }

  .bcx-sidepanel-empty h1 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  .bcx-sidepanel-empty p {
    color: #d1d5db;
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0;
  }
</style>
