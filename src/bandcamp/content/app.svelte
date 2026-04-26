<script lang="ts">
import { MessageType } from 'src/core/message';
import { currentPageUrl, storage } from 'src/core/shared';
import { console } from 'src/utils/console';
import { onCtrlShiftPlusKey } from 'src/utils/keyboard';
import { onMount } from 'svelte';
import { BCXDrawerButton, BCXTour } from '$lib/components/bcx';
import { musicPageTourSteps } from '$lib/constants/tourSteps';
import { TOUR_COMPLETE_KEY } from '../domain/storageKey';
import { isBandcampMusicUrl } from '../domain/url/helper';

let hasCompletedTour = $state(true);
let mainTourCompleted = $state(false);

onMount(() => {
  storage
    .getBooleanByKey(TOUR_COMPLETE_KEY)
    .then((completed) => {
      hasCompletedTour = completed ?? false;
    })
    .catch((error) => {
      console.warn('BCX: Failed to load tour state:', error);
      hasCompletedTour = false;
    });
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
  <BCXDrawerButton
    sidePanelOpen={false}
    onToggle={() => void toggleBrowserSidePanel()}
  />
</div>

{#if isBandcampMusicUrl(currentPageUrl)}
  <BCXTour
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
