import './musicFilter.css';
import Isotope from 'isotope-layout';
import { getMusicDataFromMusicItems } from 'src/bandcamp/content/helper';
import { createDataListForInput } from 'src/utils/dom';
import type { MusicItem } from './musicItem';

interface MusicGridItem extends HTMLLIElement {
  querySelector(selector: string): HTMLElement | null;
}

export class MusicFilter {
  private musicGrid: HTMLElement | null = null;
  private filterInput: HTMLInputElement | null = null;
  private resultsCounter: HTMLElement | null = null;
  private items: MusicGridItem[] = [];
  private debounceTimer: NodeJS.Timeout | null = null;
  private isotope: Isotope | null = null;

  constructor(private readonly musicItems: MusicItem[]) {
    this.init();
  }

  private init(): void {
    // Wait for the page to fully load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  private setup(): void {
    this.musicGrid = document.getElementById('music-grid');

    if (!this.musicGrid) {
      console.log('Bandcamp music grid not found on this page');
      return;
    }

    this.items = Array.from(
      this.musicGrid.querySelectorAll('.music-grid-item'),
    ) as MusicGridItem[];

    if (this.items.length === 0) {
      console.log('No music grid items found');
      return;
    }

    this.createFilterInterface();
    this.initIsotope();

    console.log(`Bandcamp Filter initialized with ${this.items.length} items`);
  }

  private createFilterInterface(): void {
    const filterContainer = document.createElement('div');
    filterContainer.className = 'bcx-filter-container';

    const label = document.createElement('label');
    label.className = 'bcx-filter-label';
    label.textContent = 'Filter albums by title:';

    const filterInput = document.createElement('input');
    filterInput.type = 'text';
    filterInput.className = 'bcx-filter-input';
    filterInput.placeholder = 'Type to search albums...';

    const musicData = getMusicDataFromMusicItems(this.musicItems);
    const options = musicData.artists.map((artist) =>
      artist.albumCount && artist.albumCount > 1
        ? artist.name + ` (${artist.albumCount})`
        : artist.name,
    );
    musicData.albums.forEach((album) => {
      options.push(album.artist + ' - ' + album.title);
    });

    createDataListForInput(options, filterInput);

    this.filterInput = filterInput;

    const resultsCount = document.createElement('div');
    resultsCount.className = 'filter-results-count';
    resultsCount.textContent = `Showing ${this.items.length} of ${this.items.length} albums`;

    this.resultsCounter = resultsCount;

    filterContainer.appendChild(label);
    filterContainer.appendChild(this.filterInput);
    filterContainer.appendChild(resultsCount);

    // Insert before the music grid
    if (this.musicGrid && this.musicGrid.parentNode) {
      this.musicGrid.parentNode.insertBefore(filterContainer, this.musicGrid);
    }

    // Setup filter event listener with debouncing
    this.filterInput.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (this.debounceTimer !== null) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = setTimeout(() => {
        this.filterItems(target.value.toLowerCase().trim());
      }, 300);
    });
  }

  private initIsotope(): void {
    if (!this.musicGrid) return;

    // Setup items values for filtering
    this.musicItems.forEach((item: MusicItem) => {
      const gridElement = this.musicGrid?.querySelector(
        '[data-item-id="album-' + item.id + '"]',
      );

      gridElement?.setAttribute(
        'data-filter-value',
        (item.artist.toString() + ' ' + item.title).toLowerCase(),
      );
    });

    // Initialize Isotope with options
    this.isotope = new Isotope(this.musicGrid as HTMLElement, {
      itemSelector: '.music-grid-item',
      layoutMode: 'fitRows',
    });
  }

  private filterItems(query: string): void {
    let visibleCount = 0;

    if (this.resultsCounter) {
      this.resultsCounter.textContent = `Showing ${visibleCount} of ${this.items.length} albums`;
    }

    if (this.isotope) {
      const filter = query ? `[data-filter-value*="${query}"]` : '*';
      this.isotope.arrange({ filter });
    }
  }

  public destroy(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    // Clean up Isotope
    if (this.isotope) {
      this.isotope.destroy();
      this.isotope = null;
    }

    // Remove added event listeners and DOM elements
    if (this.filterInput && this.filterInput.parentNode) {
      const filterContainer = this.filterInput.parentNode;
      if (filterContainer.parentNode) {
        filterContainer.parentNode.removeChild(filterContainer);
      }
    }
  }
}
