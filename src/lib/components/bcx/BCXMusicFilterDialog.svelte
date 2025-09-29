<script lang="ts">
/**
 * BCX Music Filter Dialog Component
 * Custom command dialog for artist/album search with Shadow DOM support
 */

import type { Dialog as DialogPrimitive } from 'bits-ui';
import * as Command from '$lib/components/ui/command/index.js';
import type {
  AlbumSearchData,
  ArtistSearchData,
  MusicSearchData,
} from './types';

let {
  open = $bindable(false),
  portalProps,
  placeholder = 'Type an artist name or album title...',
  emptyMessage = 'No results found.',
  data = { artists: [], albums: [] },
  onArtistSelect = null,
  onAlbumSelect = null,
}: {
  open?: boolean;
  portalProps?: DialogPrimitive.PortalProps;
  placeholder?: string;
  emptyMessage?: string;
  data?: MusicSearchData;
  onArtistSelect?: ((artist: ArtistSearchData) => void) | null;
  onAlbumSelect?: ((album: AlbumSearchData) => void) | null;
} = $props();

// biome-ignore lint: reactive variable declaration
let searchQuery = $state('');

function handleArtistSelect(artist: ArtistSearchData) {
  console.log(`🎵 BCX: Artist selected "${artist.name}"`);
  if (onArtistSelect) {
    onArtistSelect(artist);
  }
  searchQuery = artist.name;
}

function handleAlbumSelect(album: AlbumSearchData) {
  console.log(`💿 BCX: Album selected "${album.title}" by ${album.artist}`);
  if (onAlbumSelect) {
    onAlbumSelect(album);
  }
  open = false;
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    open = false;
  }
}
</script>

<svelte:window on:keydown={handleKeydown} />

<Command.Dialog bind:open={open} {portalProps}>
  <Command.Input bind:value={searchQuery} placeholder={placeholder} />

  <Command.List>
      <Command.Empty>{emptyMessage}</Command.Empty>
      <!-- Artists Section -->
      {#if data.artists.length > 0}
        <Command.Group heading="Artists">
          {#each data.artists as artist}
            <Command.Item onSelect={() => handleArtistSelect(artist)}>
              <span>{artist.name}{#if artist.albumCount}&nbsp;({artist.albumCount}){/if}</span>
            </Command.Item>
          {/each}
        </Command.Group>
      {/if}

      <!-- Separator if both artists and albums exist -->
      {#if data.artists.length > 0 && data.albums.length > 0}
        <Command.Separator />
      {/if}

      <!-- Albums Section -->
      {#if data.albums.length > 0}
        <Command.Group heading="Albums">
          {#each data.albums as album}
            <Command.Item onSelect={() => handleAlbumSelect(album)}>
              <span>{album.artist} - {album.title}{#if album.year} - {album.year}{/if}</span>
            </Command.Item>
          {/each}
        </Command.Group>
      {/if}

      <!-- Default content when no search query -->
      {#if !searchQuery.trim() && data.artists.length === 0 && data.albums.length === 0}
        <div>
          <h3>Search Bandcamp</h3>
          <p>
            Start typing to search for artists, albums, and tracks
          </p>
          <div>
            <kbd>↑</kbd><kbd>↓</kbd> navigate • <kbd>↵</kbd> select • <kbd>Esc</kbd> close
          </div>
        </div>
      {/if}
  </Command.List>
</Command.Dialog>

<style>
  /* BCX Search Dialog Styles */
</style>
