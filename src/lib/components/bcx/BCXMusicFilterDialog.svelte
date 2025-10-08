<script lang="ts">
/**
 * BCX Music Filter Dialog Component
 * Custom command dialog for artist/album search with Shadow DOM support
 */

import type { Dialog as DialogPrimitive } from 'bits-ui';
import type { Album } from 'src/bandcamp/album';
import type { Band } from 'src/bandcamp/band';
import { console } from 'src/utils/console';
import * as Command from '$lib/components/ui/command/index.js';
import {
  type ArtistSearchData,
  emptyMusicSearchData,
  type MusicSearchData,
} from './types';

let {
  open = $bindable(false),
  portalProps,
  placeholder = 'Type an artist name or album title...',
  emptyMessage = 'No results found.',
  minSearchLength = 2,
  data = emptyMusicSearchData,
  onArtistSelect = null,
  onBandSelect = null,
  onAlbumSelect = null,
}: {
  open?: boolean;
  portalProps?: DialogPrimitive.PortalProps;
  placeholder?: string;
  emptyMessage?: string;
  minSearchLength?: number;
  data: MusicSearchData;
  onArtistSelect?: ((artist: ArtistSearchData) => void) | null;
  onBandSelect?: ((band: Band) => void) | null;
  onAlbumSelect?: ((album: Album) => void) | null;
} = $props();

// biome-ignore lint: reactive variable declaration
let searchQuery = $state('');

const filteredData = $derived.by(() => {
  if (searchQuery.trim().length < minSearchLength) {
    return emptyMusicSearchData;
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

  // Filter bands
  const bandsStartsWith = data.bands.filter((band) =>
    band.name.toLowerCase().startsWith(query),
  );
  const bandsIncludes = data.bands.filter(
    (band) =>
      !band.name.toLowerCase().startsWith(query) &&
      band.name.toLowerCase().includes(query),
  );

  // Filter albums
  const albumsStartsWith = data.albums.filter(
    (album) =>
      album.title.toLowerCase().startsWith(query) ||
      album.artist.toString().toLowerCase().startsWith(query),
  );
  const albumsIncludes = data.albums.filter(
    (album) =>
      !album.title.toLowerCase().startsWith(query) &&
      !album.artist.toString().toLowerCase().startsWith(query) &&
      (album.title.toLowerCase().includes(query) ||
        album.artist.toString().toLowerCase().includes(query)),
  );

  return {
    artists: [...artistsStartsWith, ...artistsIncludes],
    bands: [...bandsStartsWith, ...bandsIncludes],
    albums: [...albumsStartsWith, ...albumsIncludes],
  };
});

// Check if we should show search results (based on minSearchLength)
const shouldShowResults = $derived(
  searchQuery.trim().length >= minSearchLength,
);

function handleArtistSelect(artist: ArtistSearchData) {
  console.log(`🎤 BCX: Artist selected "${artist.name}"`);
  if (onArtistSelect) {
    onArtistSelect(artist);
  }
  searchQuery = artist.name;
}

function handleBandSelect(band: Band) {
  console.log(`🎵 BCX: Band selected "${band.name}"`);
  if (onBandSelect) {
    onBandSelect(band);
  }
  searchQuery = band.name;
}

function handleAlbumSelect(album: Album) {
  console.log(
    `💿 BCX: Album selected "${album.title}" by ${album.artist.toString()}`,
  );
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
          <Command.Group heading="Artists ({filteredData.artists.length} of {data.artists.length})">
            {#each filteredData.artists as artist}
              <Command.Item onSelect={() => handleArtistSelect(artist)}>
                <span>{artist.name}{#if artist.albumCount}&nbsp;({artist.albumCount}){/if}</span>
              </Command.Item>
            {/each}
          </Command.Group>
        {/if}

        {#if filteredData.bands.length > 0}
          <!-- Separator if both artists and bands exist -->
          {#if filteredData.artists.length > 0}
            <Command.Separator />
          {/if}

          <Command.Group heading="Bands ({filteredData.bands.length} of {data.bands.length})">
            {#each filteredData.bands as band}
              <Command.Item onSelect={() => handleBandSelect(band)}>
                <span>{band.name}{#if band.albums?.length}&nbsp;({band.albums.length}){/if}</span>
              </Command.Item>
            {/each}
          </Command.Group>
        {/if}

        {#if filteredData.albums.length > 0}
          <!-- Separator if both bands and albums exist -->
          {#if filteredData.artists.length > 0 || filteredData.bands.length > 0}
            <Command.Separator />
          {/if}

          <Command.Group heading="Albums ({filteredData.albums.length} of {data.albums.length})">
            {#each filteredData.albums as album}
              <Command.Item onSelect={() => handleAlbumSelect(album)}>
                <span>{album.artist.toString()} - {album.title}{#if album.metadata?.year} - {album.metadata.year}{/if}</span>
              </Command.Item>
            {/each}
          </Command.Group>
        {/if}

        {#if filteredData.artists.length === 0 && filteredData.bands.length === 0 && filteredData.albums.length === 0}
          <Command.Empty>
            <div class="text-center py-4">
              <p class="text-sm text-muted-foreground mb-2">{emptyMessage}</p>
              <p class="text-xs text-muted-foreground">
                Available: {data.artists.length} artists, {data.bands.length} bands, {data.albums.length} albums
              </p>
            </div>
          </Command.Empty>
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
          <p class="text-xs text-muted-foreground mb-4">
            Available: {data.artists.length} artists, {data.bands.length} bands, {data.albums.length} albums
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
