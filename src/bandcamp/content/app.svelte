<script lang="ts">
import { TreeData } from 'src/app/treeview/TreeData';
import { currentPageUrl, sessionStorage } from 'src/core/shared';
import { console } from 'src/utils/console';
import { element } from 'src/utils/dom';
import { onCtrlKey } from 'src/utils/keyboard';
import { onMount } from 'svelte';
import { BCXSidePanel, BCXTour } from '$lib/components/bcx';
import BCXDrawerButton from '$lib/components/bcx/BCXDrawerButton.svelte';
import { SIDE_PANEL_OPEN_KEY } from '../domain/storageKey';
import {
  getSidePanelOpen,
  initUiState,
  setSidePanelOpen,
} from '../domain/ui/uiState';
import { isBandcampMusicUrl } from '../domain/url/helper';

// Props interface
interface Props {
  treeData?: TreeData;
}

let { treeData = new TreeData() }: Props = $props();
let shadowContainer: HTMLElement | null = $state(null);
let sidePanelOpen: boolean = $state(false);
let sidePanelStateInitialized: boolean = $state(false);

// Persist side panel state across page navigations (only after initial load)
$effect(() => {
  if (sidePanelStateInitialized) {
    sessionStorage.set({ [SIDE_PANEL_OPEN_KEY]: sidePanelOpen });
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

  const curLeft = (window.innerWidth - 950) / 2;
  const sidePanelWidth = 400;

  if (curLeft < sidePanelWidth) {
    pgBody.style.left = sidePanelOpen
      ? `${sidePanelWidth - curLeft + 20}px`
      : '';
  }
});

function handleKeydown(e: KeyboardEvent) {
  // Ctrl+D for drawer
  onCtrlKey('d', e, () => {
    sidePanelOpen = !sidePanelOpen;
  });
}

onMount(() => {
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

  // Restore side panel state from storage
  void (async () => {
    await initUiState();

    const saved = getSidePanelOpen();
    if (saved !== undefined) {
      sidePanelOpen = saved;
    }

    sidePanelStateInitialized = true;
  })();
});

async function updateSidePanelOpen(value: boolean) {
  sidePanelOpen = value; // update UI immediately

  if (!sidePanelStateInitialized) return;

  await setSidePanelOpen(value); // persist through uiState.ts
}
</script>

<svelte:document onkeydown={handleKeydown} />

{#if shadowContainer}
  <BCXDrawerButton
    sidePanelOpen={sidePanelOpen}
    onToggle={() => void updateSidePanelOpen(!sidePanelOpen)}
  />

  <!-- Side Panel -->
  <BCXSidePanel
    treeData={treeData}
    open={sidePanelOpen}
    animate={sidePanelStateInitialized}
  />

  <!-- Tour (only on music pages) -->
  {#if isBandcampMusicUrl(currentPageUrl)}
    <BCXTour
      steps={tourSteps}
      autoStart={true}
      onTourComplete={() => console.log('🎉 Tour completed!')}
      onTourSkipped={() => console.log('⏭️ Tour skipped')}
    />
  {/if}
{/if}

<style>

</style>
