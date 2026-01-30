<script lang="ts">
/**
 * BCX Music Filter Component
 */

import Isotope from 'isotope-layout';
import type { Album } from 'src/bandcamp/domain/album/album';
import type { Band } from 'src/bandcamp/domain/band/band';
import { createQueryCountString } from 'src/bandcamp/domain/page/helper';
import { getUniqueArtistNamesFromTracks } from 'src/bandcamp/domain/track/helper';
import { currentPageUrl, MUSIC_FILTER_QUERY_PARAM } from 'src/core/shared';
import { console } from 'src/utils/console';
import { createDataListForInput, element } from 'src/utils/dom';
import { removeParentheses } from 'src/utils/string';
import { onDestroy, onMount } from 'svelte';
import { musicFilterStore } from '$lib/stores/musicFilter';
import filterStyles from './BCXMusicFilter.css?inline';
import type { QueryCountMap } from './types';

interface Props {
  band: Band;
  queryCountMap?: QueryCountMap;
  musicGrid: HTMLElement;
  musicGridItems: HTMLElement[];
}

let { band, queryCountMap, musicGrid, musicGridItems }: Props = $props();

// Component state
let filterInput: HTMLInputElement | null = $state(null);
let debounceTimer: NodeJS.Timeout | null = null;
let musicIsotope: Isotope | null = null;
let searchQuery = $state(
  currentPageUrl.getQueryParam(MUSIC_FILTER_QUERY_PARAM) || '',
);
let previousQuery = '';
let visibleCount = $state(0);
let totalCount = $state(0);
let storeUnsubscribe: (() => void) | null = null;

// Reactive values
$effect(() => {
  if (searchQuery !== undefined) {
    // Scroll to input when query changes from empty to non-empty
    if (previousQuery.trim() === '' && searchQuery.trim() !== '') {
      // Only scroll when it changes from empty → non-empty
      filterInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    previousQuery = searchQuery;

    handleFilterChange(searchQuery);
    updateUrlQueryParamValue(MUSIC_FILTER_QUERY_PARAM, searchQuery);
    musicFilterStore.setSearchQuery(searchQuery);
  }
});

onMount(() => {
  console.log(
    '[BCXMusicFilter]',
    'Initialized with',
    musicGridItems.length,
    'DOM elements',
  );

  totalCount = musicGridItems.length;
  visibleCount = musicGridItems.length;

  injectStyles();
  initMusicIsotope();
  setupDataList();

  // Watch for browser navigation (Back/Forward buttons)
  window.addEventListener('popstate', handlePopState);

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

  window.removeEventListener('popstate', handlePopState);
});

function setupDataList(): void {
  if (!filterInput) return;

  const options: string[] = [];

  // Add artists
  band.metadata.artistNames.forEach((artistName) => {
    const count = queryCountMap?.get(artistName) || 0;
    options.push(createQueryCountString(artistName, count));
  });

  // We don't need to show other bands on the band page

  // Add albums
  band.metadata.albums.forEach((album) => {
    options.push(album.toString());
  });

  band.metadata.keywords.forEach((keyword) => {
    const count = queryCountMap?.get(keyword) || 0;
    options.push(createQueryCountString(keyword, count));
  });

  createDataListForInput(options, filterInput);
}

function initMusicIsotope(): void {
  band.metadata.albums.forEach((album: Album) => {
    const gridElement = musicGrid.querySelector(
      '[data-item-id="album-' + album.id + '"]',
    );

    let filterValue = album.toString();

    // Include artists from tracks in filter value
    filterValue +=
      ', ' + getUniqueArtistNamesFromTracks(album.tracks).join(', ');

    // Include keywords in filter value
    if (album.metadata) {
      filterValue += ', ' + album.metadata.keywords.join(', ');
    }

    gridElement?.setAttribute('data-filter-value', filterValue.toLowerCase());
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
  musicIsotope = new Isotope(musicGrid, {
    itemSelector: '.music-grid-item',
    layoutMode: 'fitRows',
  });
}

function updateUrlQueryParamValue(key: string, value: string): void {
  const url = currentPageUrl;

  if (value.trim()) {
    url.searchParams.set(key, value.trim());
  } else {
    url.searchParams.delete(key);
  }

  window.history.replaceState({}, '', url);
}

function handlePopState(): void {
  const q = currentPageUrl.getQueryParam(MUSIC_FILTER_QUERY_PARAM) || '';
  if (q !== searchQuery) {
    searchQuery = q;
    if (filterInput) filterInput.value = q;
    handleFilterChange(q);
  }
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
  if (!musicIsotope) return;

  const filter = query ? `[data-filter-value*="${query}"]` : '*';
  musicIsotope.arrange({ filter });

  // Update visible count
  if (query) {
    const visibleItems = musicGridItems.filter((musicGridItem) => {
      const filterValue = musicGridItem.getAttribute('data-filter-value') || '';
      return filterValue.includes(query);
    });

    // Lazy load images for visible items
    visibleItems.forEach((item) => {
      const img = element(
        'img.lazy[src="/img/0.gif"]',
        item,
      ) as HTMLImageElement | null;
      if (!img || !img.dataset.original) {
        return;
      }
      img.src = img.dataset.original;
      img.classList.remove('lazy');
      img.removeAttribute('data-original');
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
  if (musicIsotope) {
    musicIsotope.destroy();
    musicIsotope = null;
  }

  // Remove injected styles
  const styleSheet = document.getElementById('bcx-filter-styles');
  if (styleSheet) {
    styleSheet.remove();
  }
}
</script>

<div class="bcx-filter-container">
  <div class="bcx-filter-main-row">
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

    <div class="filter-results-count" title="{visibleCount} of {totalCount} items shown">
      {visibleCount} / {totalCount}
    </div>
  </div>
</div>
