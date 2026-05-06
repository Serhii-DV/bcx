<script lang="ts">
import { MessageType } from 'src/core/message';
import { currentPageUrl, storage } from 'src/core/shared';
import { BcxDrawerButton, BcxTour } from 'src/features/bcx/components';
import { musicPageTourSteps } from 'src/features/bcx/constants/tourSteps';
import { console } from 'src/utils/console';
import { onCtrlShiftPlusKey } from 'src/utils/keyboard';
import { onMount } from 'svelte';
import { TOUR_COMPLETE_KEY } from '../domain/storageKey';
import { isBandcampMusicUrl } from '../domain/url/helper';

let hasCompletedTour = $state(true);
let tourStateLoaded = $state(false);
let mainTourCompleted = $state(false);
let tourVersion = $state(0);

onMount(() => {
  storage
    .getBooleanByKey(TOUR_COMPLETE_KEY)
    .then((completed) => {
      hasCompletedTour = completed ?? false;
    })
    .catch((error) => {
      console.warn('BCX: Failed to load tour state:', error);
      hasCompletedTour = false;
    })
    .finally(() => {
      tourStateLoaded = true;
    });

  const handleStorageChanged = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string,
  ) => {
    if (areaName !== 'local' || !(TOUR_COMPLETE_KEY in changes)) {
      return;
    }

    const change = changes[TOUR_COMPLETE_KEY];
    if (change.newValue === true) {
      hasCompletedTour = true;
      tourStateLoaded = true;
      return;
    }

    tourStateLoaded = true;
    hasCompletedTour = false;
    mainTourCompleted = false;
    tourVersion += 1;
  };

  chrome.storage.onChanged.addListener(handleStorageChanged);

  return () => {
    chrome.storage.onChanged.removeListener(handleStorageChanged);
  };
});

function handleKeydown(event: KeyboardEvent) {
  onCtrlShiftPlusKey('x', event, () => {
    void toggleBrowserSidePanel();
  });
}

async function toggleBrowserSidePanel() {
  try {
    await chrome.runtime.sendMessage({ type: MessageType.TOGGLE_SIDE_PANEL });
  } catch (error) {
    console.warn('BCX: Failed to toggle browser side panel:', error);
  }
}
</script>

<svelte:document onkeydown={handleKeydown} />

<div class="bcx-browser-side-panel-drawer">
  <BcxDrawerButton
    sidePanelOpen={false}
    onToggle={() => void toggleBrowserSidePanel()}
  />
</div>

{#if isBandcampMusicUrl(currentPageUrl) && tourStateLoaded}
  {#key tourVersion}
    <BcxTour
      steps={musicPageTourSteps}
      autoStart={true}
      hasCompleted={hasCompletedTour || mainTourCompleted}
      completionStorageKey={TOUR_COMPLETE_KEY}
      onTourComplete={() => {
        mainTourCompleted = true;
        console.log('Tour completed');
      }}
      onTourSkipped={() => {
        mainTourCompleted = true;
        console.log('Tour skipped');
      }}
    />
  {/key}
{/if}

<style>
  :global(.bcx-browser-side-panel-drawer) {
    inset: auto 0 0 auto;
    pointer-events: none;
    position: fixed;
    width: 0;
    z-index: 999998;
  }
</style>
