<script lang="ts">
import { DropdownMenu } from 'bits-ui';
import { getMusicItems } from 'src/bandcamp/page/music/html';
import { Url } from 'src/bandcamp/url';
import { onCtrlKey } from 'src/utils/keyboard';
import { onMount } from 'svelte';
import BcxMainCommandDialog from '$lib/components/bcx/BCXMainCommandDialog.svelte';
import BcxMusicFilterDialog from '$lib/components/bcx/BCXMusicFilterDialog.svelte';
import type { Album, Artist, Data } from '$lib/components/bcx/types';
import { musicFilterStore } from '$lib/stores/musicFilter';
import { getMusicDataFromMusicItems } from './helper';

let shadowContainer: HTMLElement | null = $state(null);
let commandOpen = $state(false);
let albumSearchOpen = $state(false);
let musicData: Data = $state({
  artists: [],
  albums: [],
});

const pageUrl = new Url(window.location.href);

if (pageUrl.isMusic) {
  musicData = getMusicDataFromMusicItems(getMusicItems());
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

function handleArtistSelect(artist: Artist) {
  // Set the search query for the music filter using the store
  const searchValue = artist.name;
  musicFilterStore.setSearchQuery(searchValue);

  // Optional: Show confirmation
  console.log(`🔍 BCX: Filtering music grid for artist "${searchValue}"`);
}

function handleAlbumSelect(album: Album) {
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
  <DropdownMenu.Root>
    <DropdownMenu.Trigger
      class="bcx-dropdown-trigger"
    >
      BCX
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal to={shadowContainer}>
      <DropdownMenu.Content
        class="bcx-dropdown-content"
        sideOffset={8}
      >
        <DropdownMenu.Item
          class="bcx-dropdown-item"
          onSelect={() => commandOpen = true}
        >
          <span class="bcx-dropdown-icon">🔧</span>
          Main Command Dialog
          <div class="bcx-dropdown-shortcut">
            <kbd>Ctrl</kbd> + <kbd>/</kbd>
          </div>
        </DropdownMenu.Item>
        <DropdownMenu.Item
          class="bcx-dropdown-item"
          onSelect={() => albumSearchOpen = true}
        >
          <span class="bcx-dropdown-icon">🎵</span>
          Music Filter Dialog
          <div class="bcx-dropdown-shortcut">
            <kbd>Ctrl</kbd> + <kbd>M</kbd>
          </div>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
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
  data={musicData}
  placeholder="Search for artists, albums, or tracks..."
  emptyMessage="No artists or albums found"
  onArtistSelect={handleArtistSelect}
  onAlbumSelect={handleAlbumSelect}
/>
{/if}


<style>
  /* Dropdown Menu Styles - Dark Theme */
  :global(.bcx-dropdown-trigger) {
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
  }

  :global(.bcx-dropdown-trigger:hover) {
    background: #374151;
    border-color: #4b5563;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  :global(.bcx-dropdown-content) {
    background: #1f2937;
    border: 1px solid #374151;
    border-radius: 8px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    z-index: 999999;
    pointer-events: auto;
    overflow: hidden;
    padding: 0.5rem;
    min-width: 280px;
  }

  :global(.bcx-dropdown-item) {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: #f9fafb;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    width: 100%;
    text-align: left;
    position: relative;
  }

  :global(.bcx-dropdown-item:hover) {
    background: #374151;
    color: #ffffff;
  }

  :global(.bcx-dropdown-item:focus) {
    background: #374151;
    outline: none;
  }

  :global(.bcx-dropdown-icon) {
    font-size: 1.125rem;
    width: 1.5rem;
    text-align: center;
    flex-shrink: 0;
  }

  :global(.bcx-dropdown-shortcut) {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    opacity: 0.7;
  }

  :global(.bcx-dropdown-shortcut kbd) {
    background: #374151;
    border: 1px solid #4b5563;
    border-radius: 4px;
    padding: 0.125rem 0.375rem;
    font-size: 0.6875rem;
    font-family: ui-monospace, 'SFMono-Regular', monospace;
    color: #d1d5db;
  }
</style>
