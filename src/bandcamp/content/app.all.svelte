<script lang="ts">
import { TerminalIcon } from 'lucide-svelte';
import { TreeData } from 'src/app/treeview/treeData';
import { currentPageUrl } from 'src/core/shared';
import { console } from 'src/utils/console';
import { element } from 'src/utils/dom';
import { onCtrlKey } from 'src/utils/keyboard';
import { onMount } from 'svelte';
import { BCXSidePanel, BCXTour } from '$lib/components/bcx';
import BCXDrawerButton from '$lib/components/bcx/BCXDrawerButton.svelte';
import BcxMainCommandDialog from '$lib/components/bcx/BCXMainCommandDialog.svelte';
import BcxMusicFilterDialog from '$lib/components/bcx/BCXMusicFilterDialog.svelte';
import type { MusicSearchData } from '$lib/components/bcx/types';
import { musicFilterStore } from '$lib/stores/musicFilter';
import type { Album } from '../domain/album/album';
import type { Band } from '../domain/band/band';
import { createMusicSearchDataFromBands } from './helper';

// Props interface
interface Props {
  bands?: Band[];
  treeData?: TreeData;
}

let { bands = [], treeData = new TreeData() }: Props = $props();

let shadowContainer: HTMLElement | null = $state(null);
let commandOpen = $state(false);
let albumSearchOpen = $state(false);
let sidePanelOpen = $state(false);

// Derive music search data from bands prop
let musicSearchData: MusicSearchData = $derived(
  createMusicSearchDataFromBands(bands),
);

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
    id: 'main-button',
    targetElement: '#bcx-trigger-button',
    title: '⚡ Quick Actions',
    message:
      'Click here or press <kbd>Ctrl+/</kbd> to open the command palette for quick access to all BCX features.',
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
  onCtrlKey('/', e, () => {
    commandOpen = !commandOpen;
  });

  // Ctrl+M
  onCtrlKey('m', e, () => {
    albumSearchOpen = !albumSearchOpen;
  });

  // Ctrl+D for drawer
  onCtrlKey('d', e, () => {
    sidePanelOpen = !sidePanelOpen;
  });
}

onMount(() => {
  const bcxElement = document.querySelector('#bcx-app');
  if (bcxElement?.shadowRoot) {
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

    bcxElement.shadowRoot.appendChild(portalContainer);
    shadowContainer = portalContainer;
  } else {
    console.warn('❌ BCX: Could not find #bcx-app shadow root');
  }
});

function handleBandSelect(band: Band) {
  // Set the search query for the music filter using the store
  const searchValue = band.name;
  musicFilterStore.setSearchQuery(searchValue);

  // Open the band URL in the current tab
  window.location.href = band.url.toString();

  // Optional: Show confirmation
  console.log(`🔍 BCX: Filtering music grid for artist "${searchValue}"`);
}

function handleAlbumSelect(album: Album) {
  // Open the album URL in the current tab
  window.location.href = album.url.toString();
}

function handleSearchArtistAlbum() {
  albumSearchOpen = true;
}

function handleProfileSelect() {
  alert('👤 BCX: Profile feature coming soon!');
}

function handleSettingsSelect() {
  alert('⚙️ BCX: Settings feature coming soon!');
}
</script>

<svelte:document onkeydown={handleKeydown} />

{#if shadowContainer}
  <button
    id="bcx-trigger-button"
    class="bcx-trigger-button"
    title="BCX - Bandcamp Extension Menu.
Use Ctrl+/ to toggle"
    onclick={() => commandOpen = true}
  >
    <TerminalIcon /> BCX
  </button>

  <BCXDrawerButton
    sidePanelOpen={sidePanelOpen}
    onToggle={() => sidePanelOpen = !sidePanelOpen}
  />
{/if}

{#if shadowContainer}
<!-- Main Command Dialog -->
<BcxMainCommandDialog
  bind:open={commandOpen}
  portalProps={{ to: shadowContainer }}
  onSearchArtistAlbum={handleSearchArtistAlbum}
  onProfileSelect={handleProfileSelect}
  onSettingsSelect={handleSettingsSelect}
/>
<!-- Artist/Album Search Command Dialog -->
<BcxMusicFilterDialog
  bind:open={albumSearchOpen}
  portalProps={{ to: shadowContainer }}
  data={musicSearchData}
  placeholder="Search for artists or albums..."
  emptyMessage="No artists or albums found"
  onBandSelect={handleBandSelect}
  onAlbumSelect={handleAlbumSelect}
/>

<!-- Side Panel -->
<BCXSidePanel
  treeData={treeData}
  open={sidePanelOpen}
/>

<!-- Tour (only on music pages) -->
{#if currentPageUrl.isMusic}
<BCXTour
  steps={tourSteps}
  autoStart={true}
  onTourComplete={() => console.log('🎉 Tour completed!')}
  onTourSkipped={() => console.log('⏭️ Tour skipped')}
/>
{/if}
{/if}


<style>
  /* BCX Trigger Button Styles - Dark Theme */
  :global(.bcx-trigger-button) {
    background: #1f2937;
    border: 1px solid #374151;
    color: #f9fafb;
    border-radius: 8px;
    padding: 0.75rem 1.25rem;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  :global(.bcx-trigger-button:hover) {
    background: #374151;
    border-color: #4b5563;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  :global(.bcx-trigger-button:focus) {
    background: #374151;
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }

</style>
