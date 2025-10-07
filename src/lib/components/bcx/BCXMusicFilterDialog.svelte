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
  minSearchLength = 2,
  data = { artists: [], albums: [] },
  onArtistSelect = null,
  onAlbumSelect = null,
}: {
  open?: boolean;
  portalProps?: DialogPrimitive.PortalProps;
  placeholder?: string;
  emptyMessage?: string;
  minSearchLength?: number;
  data: MusicSearchData;
  onArtistSelect?: ((artist: ArtistSearchData) => void) | null;
  onAlbumSelect?: ((album: AlbumSearchData) => void) | null;
} = $props();

// biome-ignore lint: reactive variable declaration
let searchQuery = $state('');

const filteredData = $derived.by(() => {
  if (searchQuery.trim().length < minSearchLength) {
    return { artists: [], albums: [] };
  }

  const query = searchQuery.trim().toLowerCase();

  // Filter artists
  const artistsStartsWith = data.artists.filter((artist) =>
    artist.name.toLowerCase().startsWith(query),
  );
  const artistsIncludes = data.artists.filter(
    (artist) =>
      !artist.name.toLowerCase().startsWith(query) &&
      artist.name.toLowerCase().includes(query),
  );

  // Filter albums
  const albumsStartsWith = data.albums.filter(
    (album) =>
      album.title.toLowerCase().startsWith(query) ||
      album.artist.toLowerCase().startsWith(query),
  );
  const albumsIncludes = data.albums.filter(
    (album) =>
      !album.title.toLowerCase().startsWith(query) &&
      !album.artist.toLowerCase().startsWith(query) &&
      (album.title.toLowerCase().includes(query) ||
        album.artist.toLowerCase().includes(query)),
  );

  return {
    artists: [...artistsStartsWith, ...artistsIncludes],
    albums: [...albumsStartsWith, ...albumsIncludes],
  };
});

// Check if we should show search results (based on minSearchLength)
const shouldShowResults = $derived(
  searchQuery.trim().length >= minSearchLength,
);

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

<Command.Dialog bind:open={open} {portalProps} shouldFilter={false}>
  <Command.Input bind:value={searchQuery} placeholder={placeholder} />

  <Command.List>
      {#if shouldShowResults}
        {#if filteredData.artists.length > 0}
          <Command.Group heading="Artists">
            {#each filteredData.artists as artist}
              <Command.Item onSelect={() => handleArtistSelect(artist)}>
                <span>{artist.name}{#if artist.albumCount}&nbsp;({artist.albumCount}){/if}</span>
              </Command.Item>
            {/each}
          </Command.Group>
        {/if}

        {#if filteredData.albums.length > 0}
          <!-- Separator if both artists and albums exist -->
          {#if filteredData.artists.length > 0}
            <Command.Separator />
          {/if}

          <Command.Group heading="Albums">
            {#each filteredData.albums as album}
              <Command.Item onSelect={() => handleAlbumSelect(album)}>
                <span>{album.artist} - {album.title}{#if album.year} - {album.year}{/if}</span>
              </Command.Item>
            {/each}
          </Command.Group>
        {/if}

        {#if filteredData.artists.length === 0 && filteredData.albums.length === 0}
          <Command.Empty>{emptyMessage}</Command.Empty>
        {/if}
      {:else}
        <!-- Default content when search query is less than minSearchLength -->
        <div class="px-4 py-6 text-center">
          <h3 class="text-lg font-medium mb-2">Search Bandcamp</h3>
          <p class="text-sm text-muted-foreground mb-4">
            {#if searchQuery.trim().length === 0}
              Start typing to search for artists, albums, and tracks
            {:else}
              Type at least {minSearchLength} characters to search
            {/if}
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
