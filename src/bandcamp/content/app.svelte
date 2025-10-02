<script lang="ts">
import { TerminalIcon } from 'lucide-svelte';
import { MusicPage } from 'src/bandcamp/page/musicPage';
import { currentPageUrl } from 'src/core/shared';
import { onCtrlKey } from 'src/utils/keyboard';
import { onMount } from 'svelte';
import BcxMainCommandDialog from '$lib/components/bcx/BCXMainCommandDialog.svelte';
import BcxMusicFilterDialog from '$lib/components/bcx/BCXMusicFilterDialog.svelte';
import type {
  AlbumSearchData,
  ArtistSearchData,
  MusicSearchData,
} from '$lib/components/bcx/types';
import { musicFilterStore } from '$lib/stores/musicFilter';
import { createMusicSearchDataFromAlbums } from './helper';

let shadowContainer: HTMLElement | null = $state(null);
let commandOpen = $state(false);
let albumSearchOpen = $state(false);
let musicSearchData: MusicSearchData = $state({
  artists: [],
  albums: [],
});

if (currentPageUrl.isMusic) {
  musicSearchData = createMusicSearchDataFromAlbums(MusicPage.findAlbums());
}

function handleKeydown(e: KeyboardEvent) {
  onCtrlKey('/', e, () => {
    commandOpen = !commandOpen;
  });

  // Ctrl+M
  onCtrlKey('m', e, () => {
    albumSearchOpen = !albumSearchOpen;
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

function handleArtistSelect(artist: ArtistSearchData) {
  // Set the search query for the music filter using the store
  const searchValue = artist.name;
  musicFilterStore.setSearchQuery(searchValue);

  // Optional: Show confirmation
  console.log(`🔍 BCX: Filtering music grid for artist "${searchValue}"`);
}

function handleAlbumSelect(album: AlbumSearchData) {
  // Set the search query for the music filter using the store
  const searchValue = `${album.artist} - ${album.title}`;
  musicFilterStore.setSearchQuery(searchValue);

  // Optional: Show confirmation
  console.log(`🔍 BCX: Filtering music grid for "${searchValue}"`);
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
    class="bcx-trigger-button"
    title="BCX - Bandcamp Extension Menu.
Use Ctrl+/ to toggle"
    onclick={() => commandOpen = true}
  >
    <TerminalIcon /> BCX
  </button>
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
  onArtistSelect={handleArtistSelect}
  onAlbumSelect={handleAlbumSelect}
/>
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
