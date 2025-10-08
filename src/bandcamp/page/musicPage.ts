import { storage } from 'src/core/shared';
import { console } from 'src/utils/console';
import { element, elements } from 'src/utils/dom';
import { Album } from '../album';
import { Band } from '../band';
import { BandMetadata } from '../bandMetadata';
import { Url } from '../url';

interface MusicGridClientItem {
  art_id: number;
  artist: string;
  band_id: number;
  id: number;
  page_url: string;
  title: string;
  type: string;
}

export class MusicPage {
  public band: Band;
  public musicGridElement: HTMLElement | null = null;

  constructor() {
    this.band = this.createBand();

    this.musicGridElement = element('#music-grid');
    if (!this.musicGridElement) {
      console.log('[MusicPage]', 'No #music-grid found on this page');
    }

    this.band.albums = this.findAlbums(this.musicGridElement);
    storage.set(this.band);
  }

  /**
   * Finds and extracts all albums from the music grid on the current page
   * @returns Array of Album objects found on the page
   */
  private findAlbums(musicGridElement: HTMLElement | null): Album[] {
    if (!musicGridElement) {
      return [];
    }

    // Try client items data first (faster and more reliable)
    const clientItemsData = musicGridElement.dataset?.clientItems;
    if (clientItemsData) {
      let musicGridClientItems: MusicGridClientItem[] = [];
      try {
        musicGridClientItems = JSON.parse(clientItemsData);
      } catch (error) {
        console.warn(
          '[MusicPage]',
          'Failed to parse client items data:',
          error,
        );
      }

      return this.extractAlbumsFromMusicGridClientItems(musicGridClientItems);
    }

    // Fallback to DOM extraction
    console.log(
      '[MusicPage]',
      'No dataset.clientItems found, extracting from DOM elements',
    );
    return this.extractAlbumsFromMusicGridElement(musicGridElement);
  }

  /**
   * Extracts albums from music grid client items
   * @param items - Array of MusicGridClientItem objects
   * @returns Array of Album objects
   */
  private extractAlbumsFromMusicGridClientItems(
    items: MusicGridClientItem[],
  ): Album[] {
    const albums = items
      .map((item) => this.createAlbumFromClientItem(item))
      .filter((album): album is Album => album !== null);

    console.log(
      '[MusicPage]',
      `Extracted ${albums.length} albums from music grid client items data`,
    );

    return albums;
  }

  /**
   * Creates an Album from a client item
   * @param item - The music grid client item
   * @returns Album object or null if creation fails
   */
  private createAlbumFromClientItem(item: MusicGridClientItem): Album | null {
    const albumUrl = this.normalizeAlbumUrl(item.page_url);
    const artist = item.artist || this.band.name;
    return Album.create(
      albumUrl,
      artist,
      item.title,
      item.id,
      item.art_id,
      item.band_id,
    );
  }

  /**
   * Extracts album data from DOM elements when dataset.clientItems is not available
   * @param musicGridElement - The music grid container element
   * @returns Array of Album objects extracted from DOM
   */
  private extractAlbumsFromMusicGridElement(
    musicGridElement: HTMLElement,
  ): Album[] {
    const musicGridItems = elements('.music-grid-item', musicGridElement);

    const albums = musicGridItems
      .map((gridItem) => this.extractAlbumFromGridItem(gridItem))
      .filter((album): album is Album => album !== null);

    console.log(
      '[MusicPage]',
      `Extracted ${albums.length} albums from ".music-grid-item" DOM elements`,
    );
    return albums;
  }

  /**
   * Extracts album data from a single music grid item
   * @param gridItem - The individual music grid item element
   * @returns Album object or null if extraction fails
   */
  private extractAlbumFromGridItem(gridItem: HTMLElement): Album | null {
    // Extract album link - early return if not found
    const albumLink = element('a', gridItem);
    if (!albumLink) {
      console.warn('[MusicPage]', 'No album link found in grid item');
      return null;
    }

    const albumUrl = albumLink.getAttribute('href');
    if (!albumUrl) {
      console.warn('[MusicPage]', 'No album URL found in grid item');
      return null;
    }

    const normalizedAlbumUrl = this.normalizeAlbumUrl(albumUrl);

    // Extract required IDs
    const albumId = this.extractAlbumIdFromElement(gridItem);
    if (!albumId) {
      console.warn('[MusicPage]', 'No album ID found for grid item');
      return null;
    }

    // Extract title - using optional chaining for cleaner code
    const title =
      element('p.title', gridItem)?.textContent?.trim() || 'Unknown Title';

    // Extract artist - prefer data-filter-artist over band name
    const filterArtist = gridItem.getAttribute('data-filter-artist');
    const artist =
      filterArtist?.match(/^([^-]+)\s*-/)?.[1]?.trim() || this.band.name;

    // Extract optional IDs with fallbacks
    const artworkId = this.extractArtworkIdFromElement(gridItem) || 0;
    const bandId = this.extractBandIdFromElement(gridItem) || this.band.id;

    return Album.create(
      normalizedAlbumUrl,
      artist,
      title,
      albumId,
      artworkId,
      bandId,
    );
  }

  /**
   * Normalizes album URL to absolute path
   * @param albumUrl - The album URL (relative or absolute)
   * @returns Normalized absolute URL as string or Url object
   */
  private normalizeAlbumUrl(albumUrl: string): Url {
    if (albumUrl.startsWith('https://')) {
      return new Url(albumUrl);
    }
    return this.band.url.withPath(albumUrl);
  }

  /**
   * Extracts album ID from DOM element
   */
  private extractAlbumIdFromElement(gridItem: HTMLElement): number | null {
    // Try to get from data-item-id attribute first
    const itemId = gridItem.getAttribute('data-item-id');
    if (!itemId) return null;

    const match = itemId.match(/album-(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Extracts artwork ID from DOM element
   */
  private extractArtworkIdFromElement(gridItem: HTMLElement): number | null {
    const artworkImg = element('img', gridItem);
    if (!artworkImg) {
      return null;
    }

    const src = artworkImg.getAttribute('src');
    if (!src) {
      return null;
    }

    // Combined regex pattern to match both artwork ID patterns
    const match = src.match(/\/(?:a|img\/)(\d+)_/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Extracts band ID from DOM element
   */
  private extractBandIdFromElement(gridItem: HTMLElement): number | null {
    const bandId = gridItem.getAttribute('data-band-id');
    return bandId ? parseInt(bandId, 10) : null;
  }

  private createBand(): Band {
    const bandData = JSON.parse(
      element('[data-band]')?.dataset?.band || 'null',
    );

    if (!bandData) {
      throw new Error('No band data found on this page');
    }

    const bandMetadata = BandMetadata.create(
      bandData.create_date,
      bandData.currency,
    );
    const band = Band.create(
      bandData.id,
      bandData.name,
      bandData.url,
      [],
      bandMetadata,
    );

    return band;
  }
}
