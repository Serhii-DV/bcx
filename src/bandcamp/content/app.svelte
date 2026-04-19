<script lang="ts">
import { TreeData } from 'src/app/treeview/TreeData';
import { currentPageUrl } from 'src/core/shared';
import { console } from 'src/utils/console';
import { element } from 'src/utils/dom';
import { onCtrlKey } from 'src/utils/keyboard';
import { onMount } from 'svelte';
import { BCXSidePanel, BCXTour } from '$lib/components/bcx';
import { SIDE_PANEL_OPEN_KEY } from '../domain/storageKey';
import { setUiSessionBoolean } from '../domain/ui/uiState';
import { isBandcampMusicUrl } from '../domain/url/helper';

// Props interface
interface Props {
  treeData?: TreeData;
  initialSidePanelOpen?: boolean;
  hasCompletedTour?: boolean;
}

let {
  treeData = new TreeData(),
  initialSidePanelOpen = false,
  hasCompletedTour = false,
}: Props = $props();
let shadowContainer: HTMLElement | null = $state(null);
let sidePanelOpen: boolean = $state(false);
let sidePanelStateInitialized: boolean = $state(true);

// Persist side panel state across page navigations (only after initial load)
$effect(() => {
  if (sidePanelStateInitialized) {
    setUiSessionBoolean(SIDE_PANEL_OPEN_KEY, sidePanelOpen).catch((error) => {
      console.warn('❌ BCX: Failed to persist side panel state:', error);
    });
  }
});

// Tour configuration
const tourSteps = [
  {
    id: 'welcome',
    title: '🎉 Welcome to BCX!',
    message:
      "Welcome to Bandcamp Explorer! Let's take a quick tour of the main features.",
  },
  {
    id: 'drawer-button',
    targetElement: '#bcx-drawer-button',
    title: '📂 Side Panel',
    message:
      'This button opens the side panel where you can explore your music collection. You can also use <kbd>Ctrl+D</kbd> to toggle it.',
    useShadowRoot: true,
  },
  {
    id: 'music-filter',
    targetElement: '#bcx-filter-input',
    title: '🔍 Smart Search',
    message:
      'Use this search to filter artists, albums, and tracks. It works in real-time as you type!',
    delay: 1000,
  },
  {
    id: 'filter-results',
    targetElement: '.filter-results-count',
    title: '📊 Results Counter',
    message:
      'This shows the number of matching results as you search. It helps you see how many items match your current filter.',
  },
];

// Effect to change main BC block position when side panel is open
$effect(() => {
  const pgBody = element('#pgBd');
  if (pgBody === null) return;

  const shadowRoot = shadowContainer?.getRootNode();
  const sidePanel =
    shadowRoot instanceof ShadowRoot
      ? shadowRoot.querySelector('#bcx-side-panel')
      : null;
  const sidePanelWidth = sidePanel
    ? Number.parseFloat(
        getComputedStyle(sidePanel).getPropertyValue('--bcx-side-panel-width'),
      ) || 0
    : 0;
  const curLeft = (window.innerWidth - 950) / 2;

  if (curLeft < sidePanelWidth) {
    pgBody.style.left = sidePanelOpen
      ? `${sidePanelWidth - curLeft + 20}px`
      : '';
  }
});

function handleKeydown(e: KeyboardEvent) {
  // Ctrl+D for drawer
  onCtrlKey('d', e, () => {
    void updateSidePanelOpen(!sidePanelOpen);
  });

  if (e.key === 'Escape' && sidePanelOpen) {
    void updateSidePanelOpen(false);
  }
}

onMount(() => {
  sidePanelOpen = initialSidePanelOpen;

  const bcxApp = document.querySelector('#bcx-app');
  if (bcxApp?.shadowRoot) {
    const portalContainer = document.createElement('div');
    portalContainer.id = 'bcx-portal-container';
    portalContainer.setAttribute('data-bcx-portal', 'true');
    portalContainer.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 999999;
      pointer-events: none;
    `;

    // Add dark theme by default
    portalContainer.classList.add('dark');
    portalContainer.style.cssText += 'color-theme: dark;';

    bcxApp.shadowRoot.appendChild(portalContainer);
    shadowContainer = portalContainer;
  } else {
    console.warn('❌ BCX: Could not find #bcx-app shadow root');
  }
});

async function updateSidePanelOpen(value: boolean) {
  sidePanelOpen = value; // update UI immediately

  if (!sidePanelStateInitialized) return;

  await setUiSessionBoolean(SIDE_PANEL_OPEN_KEY, sidePanelOpen); // persist in sessionStorage for current session
}
</script>

<svelte:document onkeydown={handleKeydown} />

{#if shadowContainer}
  <!-- Side Panel -->
  <BCXSidePanel
    treeData={treeData}
    open={sidePanelOpen}
    onToggle={() => void updateSidePanelOpen(!sidePanelOpen)}
    onClose={() => void updateSidePanelOpen(false)}
  />

  <!-- Tour (only on music pages) -->
  {#if isBandcampMusicUrl(currentPageUrl)}
    <BCXTour
      steps={tourSteps}
      autoStart={true}
      hasCompleted={hasCompletedTour}
      onTourComplete={() => console.log('🎉 Tour completed!')}
      onTourSkipped={() => console.log('⏭️ Tour skipped')}
    />
  {/if}
{/if}

<style>

</style>
