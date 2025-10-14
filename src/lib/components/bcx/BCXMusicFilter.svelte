<script lang="ts">
/**
 * BCX Music Filter Component
 */

import Isotope from 'isotope-layout';
import type { Album } from 'src/bandcamp/album';
import type { Band } from 'src/bandcamp/band/band';
import { createMusicSearchDataFromBand } from 'src/bandcamp/content/helper';
import { console } from 'src/utils/console';
import { createDataListForInput } from 'src/utils/dom';
import { removeParentheses } from 'src/utils/string';
import { onDestroy, onMount } from 'svelte';
import { musicFilterStore } from '$lib/stores/musicFilter';
import filterStyles from './BCXMusicFilter.css?inline';

interface Props {
  band: Band;
  musicGrid: HTMLElement;
  musicGridItems: HTMLElement[];
}

let { band, musicGrid, musicGridItems }: Props = $props();

// Component state
let filterInput: HTMLInputElement | null = $state(null);
let debounceTimer: NodeJS.Timeout | null = null;
let isotope: Isotope | null = null;
let searchQuery = $state('');
let visibleCount = $state(0);
let totalCount = $state(0);
let storeUnsubscribe: (() => void) | null = null;

// Reactive values
$effect(() => {
  if (searchQuery !== undefined) {
    handleFilterChange(searchQuery);
  }
});

onMount(() => {
  console.log(
    '[BCXMusicFilter]',
    'Initialized with',
    musicGridItems.length,
    'DOM elements',
  );

  injectStyles();

  totalCount = musicGridItems.length;
  visibleCount = musicGridItems.length;

  initIsotope();
  setupDataList();

  // Subscribe to store updates
  storeUnsubscribe = musicFilterStore.subscribe((state) => {
    if (state.searchQuery && state.searchQuery !== searchQuery) {
      searchQuery = state.searchQuery;
      if (filterInput) {
        filterInput.value = state.searchQuery;
      }
    }
  });
});

onDestroy(() => {
  destroy();

  // Unsubscribe from store
  if (storeUnsubscribe) {
    storeUnsubscribe();
  }
});

function setupDataList(): void {
  if (!filterInput) return;

  const musicSearchData = createMusicSearchDataFromBand(band);
  const options: string[] = [];

  // Add artists
  musicSearchData.artists.forEach((artist) => {
    options.push(artist.name + ' (' + artist.albumCount + ')');
  });

  // We don't need to show other bands on the band page

  // Add albums
  musicSearchData.albums.forEach((album) => {
    options.push(album.artist.toString() + ' - ' + album.title);
  });

  createDataListForInput(options, filterInput);
}

function initIsotope(): void {
  band.metadata.albums.forEach((album: Album) => {
    const gridElement = musicGrid.querySelector(
      '[data-item-id="album-' + album.id + '"]',
    );

    gridElement?.setAttribute(
      'data-filter-value',
      (album.artist.toString() + ' - ' + album.title).toLowerCase(),
    );
  });

  band.metadata.tracks.forEach((track) => {
    const gridElement = musicGrid.querySelector(
      '[data-item-id="track-' + track.id + '"]',
    );

    gridElement?.setAttribute(
      'data-filter-value',
      (track.artist.toString() + ' - ' + track.title).toLowerCase(),
    );
  });

  // Initialize Isotope with options
  isotope = new Isotope(musicGrid, {
    itemSelector: '.music-grid-item',
    layoutMode: 'fitRows',
  });
}

function handleFilterChange(query: string): void {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    filterItems(query.toLowerCase());
  }, 300);
}

function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  searchQuery = target.value;
}

function handleChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  const cleanQuery = removeParentheses(target.value);
  target.value = cleanQuery;
  searchQuery = cleanQuery;
}

function filterItems(query: string): void {
  if (!isotope) return;

  const filter = query ? `[data-filter-value*="${query}"]` : '*';
  isotope.arrange({ filter });

  // Update visible count
  if (query) {
    const visibleItems = musicGridItems.filter((musicGridItem) => {
      const filterValue = musicGridItem.getAttribute('data-filter-value') || '';
      return filterValue.includes(query);
    });
    visibleCount = visibleItems.length;
  } else {
    visibleCount = totalCount;
  }
}

function clearFilter(): void {
  searchQuery = '';
  if (filterInput) {
    filterInput.value = '';
  }
}

function injectStyles(): void {
  // Check if styles are already injected
  if (document.getElementById('bcx-filter-styles')) {
    return;
  }

  const styleSheet = document.createElement('style');
  styleSheet.id = 'bcx-filter-styles';
  styleSheet.textContent = filterStyles;

  document.head.appendChild(styleSheet);
}

function destroy(): void {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }

  // Clean up Isotope
  if (isotope) {
    isotope.destroy();
    isotope = null;
  }

  // Remove injected styles
  const styleSheet = document.getElementById('bcx-filter-styles');
  if (styleSheet) {
    styleSheet.remove();
  }
}
</script>

<div class="bcx-filter-container">
  <div class="bcx-filter-input-container">
    <input
      id="bcx-filter-input"
      bind:this={filterInput}
      bind:value={searchQuery}
      oninput={handleInput}
      onchange={handleChange}
      type="text"
      class="bcx-filter-input"
      placeholder="Search for artists or albums..."
    />

    {#if searchQuery.trim()}
      <button
        type="button"
        class="bcx-filter-clear-button"
        onclick={clearFilter}
        title="Clear search"
        aria-label="Clear search"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    {/if}
  </div>

  <div class="filter-results-count">
    Showing {visibleCount} of {totalCount} albums
  </div>
</div>
