<script lang="ts">
/**
 * BCX Badge Section Component
 * Reusable component for displaying filterable badges with sorting options
 */

import Isotope from 'isotope-layout';
import { createQueryCountBadgeElement } from 'src/bandcamp/domain/page/helper';
import { onDestroy, onMount } from 'svelte';
import type { QueryCountMap } from './types';

interface Props {
  title: string;
  items: string[];
  queryCountMap?: QueryCountMap;
  badgeClass: string;
  tooltipText: string;
  showSorting?: boolean;
}

let {
  title,
  items,
  queryCountMap,
  badgeClass,
  tooltipText,
  showSorting = false,
}: Props = $props();

// Component state
let badgesContainer: HTMLElement | null = $state(null);
let isotope: Isotope | null = null;
let activeSortOption = $state<'a-z' | 'z-a' | 'count' | null>(null);

onMount(() => {
  renderBadges();
});

onDestroy(() => {
  destroy();
});

function renderBadges(): void {
  if (badgesContainer === null) return;

  // Clear existing badges
  badgesContainer.innerHTML = '';

  // Create badges
  items.forEach((item) => {
    const query = item;
    if (query) {
      const count = queryCountMap?.get(query) || 0;
      const badgeElement = createQueryCountBadgeElement(
        query,
        count,
        tooltipText,
        badgeClass,
      );
      badgeElement.setAttribute('data-count', count.toString());
      badgesContainer?.appendChild(badgeElement);
    }
  });

  if (showSorting) {
    initIsotope();
  }
}

function initIsotope(): void {
  if (!badgesContainer) return;

  // Initialize Isotope with options
  isotope = new Isotope(badgesContainer, {
    itemSelector: `.${badgeClass}`,
    layoutMode: 'fitRows',
    getSortData: {
      query: '[data-search-query]',
      count: '[data-count] parseInt',
    },
  });
}

function sortBadges(sortBy: 'a-z' | 'z-a' | 'count'): void {
  if (!isotope) return;

  activeSortOption = sortBy;

  switch (sortBy) {
    case 'a-z':
      isotope.arrange({ sortBy: 'query', sortAscending: true });
      break;
    case 'z-a':
      isotope.arrange({ sortBy: 'query', sortAscending: false });
      break;
    case 'count':
      isotope.arrange({ sortBy: 'count', sortAscending: false });
      break;
  }
}

function destroy(): void {
  // Clean up Isotope
  if (isotope) {
    isotope.destroy();
    isotope = null;
  }
}
</script>

<div class="bcx-filter-badges">
  <details>
    <summary>{title} ({items.length})</summary>

    {#if showSorting}
      <div class="bcx-sort-badges-container">
        <button
          type="button"
          class="bcx-sort-badges-button {activeSortOption === 'a-z' ? 'is-checked' : ''}"
          onclick={() => sortBadges('a-z')}
          title="Sort alphabetically"
          aria-label="Sort alphabetically"
        >A-Z</button>
        <button
          type="button"
          class="bcx-sort-badges-button {activeSortOption === 'z-a' ? 'is-checked' : ''}"
          onclick={() => sortBadges('z-a')}
          title="Sort reverse alphabetically"
          aria-label="Sort reverse alphabetically"
        >Z-A</button>
        <button
          type="button"
          class="bcx-sort-badges-button {activeSortOption === 'count' ? 'is-checked' : ''}"
          onclick={() => sortBadges('count')}
          title="Sort by count"
          aria-label="Sort by count"
        >By Count</button>
      </div>
    {/if}

    <div class="bcx-badges-container" bind:this={badgesContainer}></div>
  </details>
</div>
