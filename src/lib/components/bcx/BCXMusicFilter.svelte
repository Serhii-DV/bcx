<script lang="ts">
/**
 * BCX Music Filter Component
 */

import Isotope from 'isotope-layout';
import { getMusicDataFromMusicItems } from 'src/bandcamp/content/helper';
import type { MusicItem } from 'src/bandcamp/page/music/musicItem';
import { createDataListForInput } from 'src/utils/dom';
import { removeParentheses } from 'src/utils/string';
import { onDestroy, onMount } from 'svelte';

interface MusicGridItem extends HTMLLIElement {
  querySelector(selector: string): HTMLElement | null;
}

interface Props {
  musicItems: MusicItem[];
}

let { musicItems }: Props = $props();

// Component state
let musicGrid: HTMLElement | null = $state(null);
let filterInput: HTMLInputElement | null = $state(null);
let items: MusicGridItem[] = $state([]);
let debounceTimer: NodeJS.Timeout | null = null;
let isotope: Isotope | null = null;
let searchQuery = $state('');
let visibleCount = $state(0);
let totalCount = $state(0);

// Reactive values
$effect(() => {
  if (searchQuery !== undefined) {
    handleFilterChange(searchQuery);
  }
});

onMount(() => {
  setup();
});

onDestroy(() => {
  destroy();
});

function setup(): void {
  musicGrid = document.getElementById('music-grid');

  if (!musicGrid) {
    console.log('Bandcamp music grid not found on this page');
    return;
  }

  items = Array.from(
    musicGrid.querySelectorAll('.music-grid-item'),
  ) as MusicGridItem[];

  if (items.length === 0) {
    console.log('No music grid items found');
    return;
  }

  totalCount = items.length;
  visibleCount = items.length;

  initIsotope();
  setupDataList();

  console.log(`Bandcamp Filter initialized with ${items.length} items`);
}

function setupDataList(): void {
  if (!filterInput) return;

  const musicData = getMusicDataFromMusicItems(musicItems);
  const options = musicData.artists.map((artist) =>
    artist.albumCount && artist.albumCount > 1
      ? artist.name + ` (${artist.albumCount})`
      : artist.name,
  );

  musicData.albums.forEach((album) => {
    options.push(album.artist + ' - ' + album.title);
  });

  createDataListForInput(options, filterInput);
}

function initIsotope(): void {
  if (!musicGrid) return;

  // Setup items values for filtering
  musicItems.forEach((item: MusicItem) => {
    const gridElement = musicGrid?.querySelector(
      '[data-item-id="album-' + item.id + '"]',
    );

    gridElement?.setAttribute(
      'data-filter-value',
      (item.artist.toString() + ' - ' + item.title).toLowerCase(),
    );
  });

  // Initialize Isotope with options
  isotope = new Isotope(musicGrid as HTMLElement, {
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
    const visibleItems = items.filter((item) => {
      const filterValue = item.getAttribute('data-filter-value') || '';
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

function destroy(): void {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }

  // Clean up Isotope
  if (isotope) {
    isotope.destroy();
    isotope = null;
  }
}
</script>

<div class="bcx-filter-container">
  <label for="bcx-filter-input" class="bcx-filter-label">
    Filter albums by title:
  </label>

  <div class="bcx-filter-input-container">
    <input
      id="bcx-filter-input"
      bind:this={filterInput}
      bind:value={searchQuery}
      oninput={handleInput}
      type="text"
      class="bcx-filter-input"
      placeholder="Type to search albums..."
    />

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
  </div>

  <div class="filter-results-count">
    Showing {visibleCount} of {totalCount} albums
  </div>
</div>

<style>
/* Filter interface styling */
.bcx-filter-container {
  margin: 20px 0;
  padding: 15px;
}

.bcx-filter-input-container {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  max-width: 400px;
}

.bcx-filter-input {
  flex: 1;
  field-sizing: content;
  padding: 8px 12px;
  font-size: 16px;
  background-color: transparent;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 10px;
}

.bcx-filter-input:focus {
  border-color: #0070f3;
  box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.1);
  outline: none;
}

.bcx-filter-clear-button {
  background: none;
  border: 0;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
  height: fit-content;
  margin-bottom: 10px;
}

.bcx-filter-clear-button:hover {
  color: #333;
  background-color: rgba(0, 0, 0, 0.1);
  border-color: #999;
}

.bcx-filter-clear-button:focus {
  outline: 2px solid #0070f3;
  outline-offset: 1px;
}

.bcx-filter-label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

.filter-results-count {
  font-size: 14px;
  color: #666;
}

/* Hide filtered out items */
:global(.filtered-hidden) {
  display: none !important;
}
</style>
