<script lang="ts">
import { MoonIcon, SunIcon } from 'lucide-svelte';
import { ModeWatcher, toggleMode } from 'mode-watcher';
import { getMusicItems } from 'src/bandcamp/page/music/html';
import type { MusicItem } from 'src/bandcamp/page/music/musicItem';
import { Url } from 'src/bandcamp/url';
import { countOccurrences } from 'src/utils/array';
import { onCtrlKey } from 'src/utils/keyboard';
import { onMount } from 'svelte';
import BcxMainCommandDialog from '$lib/components/bcx/BCXMainCommandDialog.svelte';
import BcxMusicFilterDialog from '$lib/components/bcx/BCXMusicFilterDialog.svelte';
import type { Album, Artist, Data } from '$lib/components/bcx/types';
import { Button } from '$lib/components/ui/button/index.js';
import * as Dialog from '$lib/components/ui/dialog/index.js';

let dialogOpen = $state(false);
let shadowContainer: HTMLElement | null = $state(null);
let commandOpen = $state(false);
let albumSearchOpen = $state(false);
let musicData: Data = {
  artists: [],
  albums: [],
};

const pageUrl = new Url(window.location.href);

if (pageUrl.isMusic) {
  musicData = getMusicDataFromMusicItems(getMusicItems());
}

function handleKeydown(e: KeyboardEvent) {
  onCtrlKey('/', e, () => {
    commandOpen = !commandOpen;
  });

  onCtrlKey('d', e, () => {
    dialogOpen = !dialogOpen;
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

function getMusicDataFromMusicItems(musicItems: MusicItem[]): Data {
  const values: string[] = [];

  musicItems.forEach((item) => {
    values.push(...item.artist.names);
  });
  const counts = countOccurrences(values.sort());
  const artists: Artist[] = mapToArtists(counts);
  const albums: Album[] = musicItems
    .map((item) => ({
      url: item.url.toString(),
      artist: item.artist.toString(),
      title: item.title,
    }))
    .sort((a, b) => {
      const aKey = `${a.artist} - ${a.title}`;
      const bKey = `${b.artist} - ${b.title}`;
      return aKey.localeCompare(bKey);
    });

  return {
    artists,
    albums,
  };
}

/**
 * Converts the result from countOccurrences to an array of Artist objects.
 *
 * @param countMap - The Map returned by countOccurrences method
 * @returns An array of Artist objects with name and albumCount
 *
 * @example
 * ```typescript
 * const artists = ['Beatles', 'beatles', 'Queen', 'QUEEN', 'Beatles'];
 * const counts = countOccurrences(artists);
 * const artistObjects = mapToArtists(counts);
 * // Result: [
 * //   { name: 'beatles', albumCount: 3 },
 * //   { name: 'queen', albumCount: 2 }
 * // ]
 * ```
 */
export function mapToArtists(countMap: Map<string, number>): Artist[] {
  return Array.from(countMap.entries()).map(([name, count]) => ({
    name: name,
    albumCount: count,
  }));
}

function handleButtonClick() {
  alert('🎵 BCX Extension Alert!\nButton clicked');
}

function handleArtistSelect(artist: any) {
  console.log(`🎵 BCX: Selected artist "${artist.name}"`);
  alert(`🎵 BCX: Navigating to ${artist.name} discography`);
}

function handleAlbumSelect(album: any) {
  console.log(`💿 BCX: Selected album "${album.title}"`);
  alert(`💿 BCX: Opening ${album.title} by ${album.artist}`);
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

<ModeWatcher defaultMode="dark" />

<div class="bcx-extension">
  <div class="bcx-header">
    <h3 class="bcx-title">🎵 BCX Extension</h3>
    <div class="bcx-status">
      <div class="bcx-status-dot"></div>
      <span class="bcx-status-text">Active</span>
    </div>
  </div>

  <div class="bcx-controls">
    <Button onclick={toggleMode} variant="outline" size="icon">
      <SunIcon class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 !transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 !transition-all dark:rotate-0 dark:scale-100" />
      <span class="sr-only">Toggle theme</span>
    </Button>

    <Button variant="destructive" onclick={handleButtonClick} class="bcx-button">
      🎵 Test Button
    </Button>

    <Button
      variant="outline"
      onclick={() => dialogOpen = true}
      class="bcx-button"
    >
      🔧 Open Dialog (Ctrl+/)
    </Button>
  </div>

  <div class="bcx-shortcuts">
    <span class="bcx-shortcut">
      <kbd>Ctrl</kbd> + <kbd>/</kbd> - Toggle Command Dialog
    </span>
  </div>

<!-- Dialog with Shadow DOM Portal -->
{#if shadowContainer}
  <Dialog.Root bind:open={dialogOpen}>
    <Dialog.Portal to={shadowContainer}>
      <Dialog.Overlay class="bcx-dialog-overlay" />
      <Dialog.Content class="bcx-dialog-content" portalProps={{to: shadowContainer}}>
        <Dialog.Header class="bcx-dialog-header">
          <Dialog.Title class="bcx-dialog-title">
            🎵 BCX Extension Dialog
          </Dialog.Title>
          <Dialog.Description class="bcx-dialog-description">
            This dialog is rendered inside the Shadow DOM
            All styles are isolated from the main page.
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Close class="bcx-dialog-close">
          <span class="bcx-close-icon">✕</span>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
{/if}

</div>

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
  .bcx-extension {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 16px;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.1);
    position: fixed;
    top: auto;
    right: 20px;
    bottom: 10px;
    z-index: 999999;
    padding: 1.5rem;
    min-width: 320px;
    backdrop-filter: blur(10px);
  }

  .bcx-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
  }

  .bcx-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    background: linear-gradient(45deg, #ffffff, #e0e7ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .bcx-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .bcx-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .bcx-status-text {
    font-size: 0.75rem;
    opacity: 0.9;
  }

  .bcx-controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .bcx-shortcuts {
    margin-bottom: 1rem;
    text-align: center;
  }

  .bcx-shortcut {
    font-size: 0.75rem;
    opacity: 0.8;
  }

  .bcx-shortcut kbd {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    padding: 0.125rem 0.375rem;
    font-size: 0.6875rem;
    font-family: ui-monospace, 'SFMono-Regular', monospace;
    margin: 0 0.125rem;
  }

  /* Shadow DOM Dialog Styles */
  /* These styles work within the Shadow DOM container */

  :global(.bcx-dialog-overlay) {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    z-index: 999998;
    pointer-events: auto;
    animation: bcx-fade-in 0.2s ease-out;
  }

  :global(.bcx-dialog-content) {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90vw;
    max-width: 640px;
    max-height: 80vh;
    background: white;
    border-radius: 16px;
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04),
      0 0 0 1px rgba(0, 0, 0, 0.05);
    z-index: 999999;
    pointer-events: auto;
    animation: bcx-slide-in 0.2s ease-out;
    overflow: hidden;
  }

  :global(.bcx-dialog-header) {
    padding: 1.5rem 1.5rem 1rem 1.5rem;
    border-bottom: 1px solid #f3f4f6;
  }

  :global(.bcx-dialog-title) {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.3;
  }

  :global(.bcx-dialog-description) {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.5;
  }

  :global(.bcx-dialog-body) {
    padding: 1.5rem;
  }

  :global(.bcx-feature-list) {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  :global(.bcx-feature) {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 12px;
    border: 1px solid #f3f4f6;
  }

  :global(.bcx-feature-icon) {
    font-size: 1.5rem;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 8px;
    flex-shrink: 0;
  }

  :global(.bcx-feature-content h4) {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
  }

  :global(.bcx-feature-content p) {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.4;
  }

  :global(.bcx-dialog-footer) {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem 1.5rem 1.5rem 1.5rem;
    border-top: 1px solid #f3f4f6;
    background: #fafafa;
  }

  :global(.bcx-dialog-button) {
    min-width: 80px;
  }

  :global(.bcx-dialog-button-primary) {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-color: #667eea;
  }

  :global(.bcx-dialog-close) {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #6b7280;
    transition: all 0.15s ease;
    z-index: 10;
  }

  :global(.bcx-dialog-close:hover) {
    background: #f3f4f6;
    border-color: #d1d5db;
    color: #374151;
  }

  :global(.bcx-close-icon) {
    font-size: 0.875rem;
    font-weight: 600;
  }

  @keyframes bcx-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes bcx-slide-in {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.95) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1) translateY(0);
    }
  }
</style>
