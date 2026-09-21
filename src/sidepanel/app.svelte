<script lang="ts">
import { SIDE_PANEL_TOUR_COMPLETE_KEY } from 'src/bandcamp/domain/storageKey';
import { MessageType } from 'src/core/message';
import { storage } from 'src/core/shared';
import { BcxSidePanel, BcxTour } from 'src/features/bcx/components';
import { sidePanelTourSteps } from 'src/features/bcx/constants/tourSteps';
import type { SidePanelHeader } from 'src/features/bcx/sidePanelHeader';
import type { SidePanelSection } from 'src/features/treeview/SidePanelSection';
import { console } from 'src/utils/console';
import { onCtrlShiftPlusKey } from 'src/utils/keyboard';
import { onMount } from 'svelte';
import {
  type ActiveBandcampTab,
  createActiveTabSidePanelData,
  getActiveBandcampTab,
  getActiveTabHeader,
} from './services/activeTabTreeData';
import { shouldReloadActiveTab } from './services/activeTabUpdates';

let sidePanelSections: SidePanelSection[] | null = $state(null);
let activeTab: ActiveBandcampTab | null = $state(null);
let errorMessage = $state('');
let isLoading = $state(true);
let hasCompletedSidePanelTour = $state(true);
let sidePanelTourStateLoaded = $state(false);
let sidePanelTourCompleted = $state(false);
let sidePanelTourVersion = $state(0);
let sectionLoadGeneration = 0;
let headerGeneration = 0;
let header: SidePanelHeader | null = $state(null);

onMount(() => {
  loadSidePanelSections();
  loadSidePanelTourState();

  const handleActivated = (info: chrome.tabs.OnActivatedInfo) => {
    if (info.tabId !== activeTab?.id) void loadSidePanelSections();
  };
  const handleUpdated = (
    tabId: number,
    changeInfo: chrome.tabs.OnUpdatedInfo,
  ) => {
    const navigationUrls =
      sidePanelSections?.flatMap((section) => section.navigationUrls ?? []) ??
      [];
    if (shouldReloadActiveTab(activeTab, tabId, changeInfo, navigationUrls)) {
      void loadSidePanelSections();
    } else if (activeTab?.id === tabId) {
      if (changeInfo.url) activeTab = { ...activeTab, url: changeInfo.url };
      if (changeInfo.url || changeInfo.status === 'complete') {
        void refreshHeader(activeTab);
      }
    }
  };

  chrome.tabs.onActivated.addListener(handleActivated);
  chrome.tabs.onUpdated.addListener(handleUpdated);
  chrome.storage.onChanged.addListener(handleStorageChanged);

  return () => {
    sectionLoadGeneration += 1;
    headerGeneration += 1;
    chrome.tabs.onActivated.removeListener(handleActivated);
    chrome.tabs.onUpdated.removeListener(handleUpdated);
    chrome.storage.onChanged.removeListener(handleStorageChanged);
  };
});

async function refreshHeader(tab: ActiveBandcampTab) {
  const generation = ++headerGeneration;
  header = null;
  try {
    const nextHeader = await getActiveTabHeader(tab);
    if (generation === headerGeneration) header = nextHeader;
  } catch (error) {
    console.warn('BCX: Failed to load page header:', error);
  }
}

async function loadSidePanelSections() {
  const generation = ++sectionLoadGeneration;
  const currentHeaderGeneration = ++headerGeneration;
  header = null;
  isLoading = true;
  errorMessage = '';

  try {
    const tab = await getActiveBandcampTab();
    if (generation !== sectionLoadGeneration) return;
    activeTab = tab;

    if (!tab) {
      sidePanelSections = null;
      return;
    }

    const data = await createActiveTabSidePanelData(tab);
    if (generation !== sectionLoadGeneration) return;
    sidePanelSections = data.sections;
    if (currentHeaderGeneration === headerGeneration) header = data.header;
  } catch (error) {
    if (generation !== sectionLoadGeneration) return;
    errorMessage =
      error instanceof Error ? error.message : 'Failed to load Music Explorer';
    sidePanelSections = null;
  } finally {
    if (generation === sectionLoadGeneration) isLoading = false;
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
</script>

<svelte:document onkeydown={handleKeydown} />

{#if sidePanelSections}
  <BcxSidePanel {header} sections={sidePanelSections} open={true} browserPanel={true} />
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
