<script lang="ts">
import type { SidePanelSection } from 'src/app/treeview/SidePanelSection';
import { SIDE_PANEL_TOUR_COMPLETE_KEY } from 'src/bandcamp/domain/storageKey';
import { MessageType } from 'src/core/message';
import { storage } from 'src/core/shared';
import { console } from 'src/utils/console';
import { onCtrlShiftPlusKey } from 'src/utils/keyboard';
import { onMount } from 'svelte';
import { BcxSidePanel, BcxTour } from '$lib/components/bcx';
import { sidePanelTourSteps } from '$lib/constants/tourSteps';
import {
  type ActiveBandcampTab,
  createActiveTabSidePanelSections,
  getActiveBandcampTab,
} from './activeTabTreeData';

let sidePanelSections: SidePanelSection[] | null = $state(null);
let activeTab: ActiveBandcampTab | null = $state(null);
let errorMessage = $state('');
let isLoading = $state(true);
let hasCompletedSidePanelTour = $state(true);
let sidePanelTourStateLoaded = $state(false);
let sidePanelTourCompleted = $state(false);
let sidePanelTourVersion = $state(0);

onMount(() => {
  loadSidePanelSections();
  loadSidePanelTourState();

  const handleActivated = () => {
    void loadSidePanelSections();
  };
  const handleUpdated = (tabId: number, changeInfo: { url?: string }) => {
    if (
      tabId === activeTab?.id &&
      changeInfo.url &&
      shouldReloadForUrlChange(activeTab.url, changeInfo.url)
    ) {
      void loadSidePanelSections();
    }
  };

  chrome.tabs.onActivated.addListener(handleActivated);
  chrome.tabs.onUpdated.addListener(handleUpdated);
  chrome.storage.onChanged.addListener(handleStorageChanged);

  return () => {
    chrome.tabs.onActivated.removeListener(handleActivated);
    chrome.tabs.onUpdated.removeListener(handleUpdated);
    chrome.storage.onChanged.removeListener(handleStorageChanged);
  };
});

async function loadSidePanelSections() {
  isLoading = true;
  errorMessage = '';

  try {
    const tab = await getActiveBandcampTab();
    activeTab = tab;

    if (!tab) {
      sidePanelSections = null;
      return;
    }

    sidePanelSections = await createActiveTabSidePanelSections(tab);
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : 'Failed to load Music Explorer';
    sidePanelSections = null;
  } finally {
    isLoading = false;
  }
}

async function loadSidePanelTourState() {
  try {
    hasCompletedSidePanelTour =
      (await storage.getBooleanByKey(SIDE_PANEL_TOUR_COMPLETE_KEY)) ?? false;
  } catch (error) {
    console.warn('BCX: Failed to load side panel tour state:', error);
    hasCompletedSidePanelTour = false;
  } finally {
    sidePanelTourStateLoaded = true;
  }
}

function handleKeydown(event: KeyboardEvent) {
  onCtrlShiftPlusKey('x', event, () => {
    void toggleBrowserSidePanel();
  });
}

function handleStorageChanged(
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: string,
) {
  if (areaName !== 'local' || !(SIDE_PANEL_TOUR_COMPLETE_KEY in changes)) {
    return;
  }

  const change = changes[SIDE_PANEL_TOUR_COMPLETE_KEY];
  if (change.newValue === true) {
    hasCompletedSidePanelTour = true;
    return;
  }

  hasCompletedSidePanelTour = false;
  sidePanelTourCompleted = false;
  sidePanelTourVersion += 1;
}

async function toggleBrowserSidePanel() {
  await chrome.runtime.sendMessage({
    type: MessageType.TOGGLE_SIDE_PANEL,
    tabId: activeTab?.id,
  });
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

<svelte:document onkeydown={handleKeydown} />

{#if sidePanelSections}
  <BcxSidePanel sections={sidePanelSections} open={true} browserPanel={true} />
  {#if sidePanelTourStateLoaded}
    {#key sidePanelTourVersion}
      <BcxTour
        steps={sidePanelTourSteps}
        autoStart={true}
        hasCompleted={hasCompletedSidePanelTour || sidePanelTourCompleted}
        completionStorageKey={SIDE_PANEL_TOUR_COMPLETE_KEY}
        onTourComplete={() => {
          sidePanelTourCompleted = true;
          console.log('Side panel tour completed');
        }}
        onTourSkipped={() => {
          sidePanelTourCompleted = true;
          console.log('Side panel tour skipped');
        }}
      />
    {/key}
  {/if}
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
