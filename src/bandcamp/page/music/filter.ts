import './musicFilter.css';

interface MusicGridItem extends HTMLLIElement {
  querySelector(selector: string): HTMLElement | null;
}

export class MusicFilter {
  private musicGrid: HTMLElement | null = null;
  private filterInput: HTMLInputElement | null = null;
  private resultsCounter: HTMLElement | null = null;
  private items: MusicGridItem[] = [];
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor() {
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
    this.setupMasonryLayout();
    this.setupImageLoadHandlers();

    console.log(`Bandcamp Filter initialized with ${this.items.length} items`);
  }

  private createFilterInterface(): void {
    const filterContainer = document.createElement('div');
    filterContainer.className = 'bcx-filter-container';

    const label = document.createElement('label');
    label.className = 'bcx-filter-label';
    label.textContent = 'Filter albums by title:';

    this.filterInput = document.createElement('input');
    this.filterInput.type = 'text';
    this.filterInput.className = 'bcx-filter-input';
    this.filterInput.placeholder = 'Type to search albums...';

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

  private setupMasonryLayout(): void {
    // Apply masonry layout after images load
    this.updateMasonryLayout();
  }

  private setupImageLoadHandlers(): void {
    this.items.forEach((item) => {
      const img = item.querySelector('.art img') as HTMLImageElement;
      if (img) {
        if (img.complete) {
          this.updateMasonryLayout();
        } else {
          img.addEventListener('load', () => {
            this.updateMasonryLayout();
          });
        }
      }
    });
  }

  private updateMasonryLayout(): void {
    // Calculate and apply grid row span for each visible item
    requestAnimationFrame(() => {
      const visibleItems = this.items.filter(
        (item) => !item.classList.contains('filtered-hidden'),
      );

      visibleItems.forEach((item) => {
        const content = item.querySelector('a');
        if (content) {
          const contentHeight = content.getBoundingClientRect().height;
          const rowHeight = 10; // Must match grid-auto-rows in CSS
          const rowSpan = Math.ceil(contentHeight / rowHeight);
          (item as HTMLElement).style.gridRowEnd = `span ${rowSpan}`;
        }
      });
    });
  }

  private filterItems(query: string): void {
    let visibleCount = 0;

    this.items.forEach((item) => {
      const titleElement = item.querySelector('.title');
      const title = titleElement
        ? titleElement.textContent?.toLowerCase() || ''
        : '';

      if (query === '' || title.includes(query)) {
        item.classList.remove('filtered-hidden');
        visibleCount++;
      } else {
        item.classList.add('filtered-hidden');
      }
    });

    // Update results counter
    if (this.resultsCounter) {
      this.resultsCounter.textContent = `Showing ${visibleCount} of ${this.items.length} albums`;
    }

    // Update masonry layout after filtering
    setTimeout(() => {
      this.updateMasonryLayout();
    }, 50);
  }

  public destroy(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    if (this.filterInput) {
      // this.filterInput.removeEventListener('input', this.filterItems);
    }
  }
}
