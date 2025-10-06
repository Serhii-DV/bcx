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
  MusicSearchGroup,
} from './types';

let {
  open = $bindable(false),
  portalProps,
  placeholder = 'Type an artist name or album title...',
  emptyMessage = 'No results found.',
  data = [],
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

// Dynamic filtering based on search query
let filteredData = $derived.by(() => {
  const query = searchQuery.trim().toLowerCase();

  // Return empty array if no search query
  if (!query) {
    return [] as MusicSearchData;
  }

  // Filter data based on search query
  return data
    .map((group) => {
      // Separate artists into startsWith and includes groups
      const startsWithArtists = group.artists.filter((artist) =>
        artist.name.toLowerCase().startsWith(query),
      );
      const includesArtists = group.artists.filter(
        (artist) =>
          !artist.name.toLowerCase().startsWith(query) &&
          artist.name.toLowerCase().includes(query),
      );

      // Separate albums into startsWith and includes groups
      const startsWithAlbums = group.albums.filter(
        (album) =>
          album.artist.toLowerCase().startsWith(query) ||
          album.title.toLowerCase().startsWith(query),
      );
      const includesAlbums = group.albums.filter(
        (album) =>
          !album.artist.toLowerCase().startsWith(query) &&
          !album.title.toLowerCase().startsWith(query) &&
          (album.artist.toLowerCase().includes(query) ||
            album.title.toLowerCase().includes(query)),
      );

      return {
        name: group.name,
        artists: [...startsWithArtists, ...includesArtists],
        albums: [...startsWithAlbums, ...includesAlbums],
      } as MusicSearchGroup;
    })
    .filter((group) => group.artists.length > 0 || group.albums.length > 0);
});

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

      {#each filteredData as group (group.name)}
        {#if group.artists.length > 0 || group.albums.length > 0}
          <Command.Group heading={group.name}>
            <!-- Artists in Group -->
            {#each group.artists as artist}
              <Command.Item onSelect={() => handleArtistSelect(artist)}>
                <span>{artist.name}{#if artist.albumCount}&nbsp;({artist.albumCount}){/if}</span>
              </Command.Item>
            {/each}

            <!-- Separator if both artists and albums exist in group -->
            {#if group.artists.length > 0 && group.albums.length > 0}
              <Command.Separator />
            {/if}

            <!-- Albums in Group -->
            {#each group.albums as album}
              <Command.Item onSelect={() => handleAlbumSelect(album)}>
                <span>{album.artist} - {album.title}{#if album.year} - {album.year}{/if}</span>
              </Command.Item>
            {/each}
          </Command.Group>
        {/if}
      {/each}

      <!-- Default content when no search query -->
      {#if !searchQuery.trim()}
        <div class="px-4 py-6 text-center">
          <h3 class="text-lg font-medium mb-2">Search Bandcamp</h3>
          <p class="text-sm text-muted-foreground mb-4">
            Start typing to search for artists, albums, and tracks
          </p>
          <div class="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <kbd class="px-1.5 py-0.5 text-xs bg-muted border rounded">↑</kbd>
            <kbd class="px-1.5 py-0.5 text-xs bg-muted border rounded">↓</kbd>
            <span>navigate •</span>
            <kbd class="px-1.5 py-0.5 text-xs bg-muted border rounded">↵</kbd>
            <span>select •</span>
            <kbd class="px-1.5 py-0.5 text-xs bg-muted border rounded">Esc</kbd>
            <span>close</span>
          </div>
        </div>
      {/if}
  </Command.List>
</Command.Dialog>

<style>
  /* BCX Search Dialog Styles */
</style>
