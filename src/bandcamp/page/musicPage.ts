import { console } from 'src/utils/console';
import { element, elements } from 'src/utils/dom';
import { removeInvisibleChars, trim } from 'src/utils/string';
import { Album } from '../album';
import { Band } from '../band/band';
import { BandMetadata } from '../band/bandMetadata';
import { BandFactory } from '../band/factory';
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
  public musicGridItemElements: HTMLElement[];

  constructor() {
    this.band = this.createBand();

    this.musicGridElement = element('#music-grid');
    if (!this.musicGridElement) {
      console.log('[MusicPage]', 'No #music-grid found on this page');
    }

    this.musicGridItemElements = elements(
      '.music-grid-item',
      this.musicGridElement,
    );
    this.band.albums = this.findAlbums();
  }

  /**
   * Finds and extracts all albums on the current page
   * @returns Array of Album objects found on the page
   */
  private findAlbums(): Album[] {
    // It looks like clientItems data attribute doesn't contain "featured" releases
    // We can't use this method. Let's use this method as a fallback.

    const albums = this.extractAlbumsFromDOM();

    if (!albums.length) {
      return this.extractAlbumsFromDataAttr();
    }

    return albums;
  }

  /**
   * Extracts albums from music grid client items
   * @param items - Array of MusicGridClientItem objects
   * @returns Array of Album objects
   */
  private extractAlbumsFromDataAttr(): Album[] {
    const clientItemsData = this.musicGridElement?.dataset?.clientItems;

    if (!clientItemsData) {
      console.log(
        '[MusicPage]',
        'No dataset.clientItems found, extracting from DOM elements',
      );

      return [];
    }

    try {
      const items: MusicGridClientItem[] = JSON.parse(clientItemsData);

      console.log(
        '[MusicPage]',
        'Music grid client items has',
        items.length,
        'items',
      );

      const albums = items
        .map((item) => this.createAlbumFromClientItem(item))
        .filter((album): album is Album => album !== null);

      console.log(
        '[MusicPage]',
        'Extracted',
        albums.length,
        'albums from music grid client items data',
      );

      return albums;
    } catch (error) {
      console.warn('[MusicPage]', 'Failed to parse client items data:', error);
    }

    return [];
  }

  /**
   * Creates an Album from a client item
   * @param item - The music grid client item
   * @returns Album object or null if creation fails
   */
  private createAlbumFromClientItem(item: MusicGridClientItem): Album | null {
    const albumUrl = this.normalizeUrl(item.page_url);
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
   * @returns Array of Album objects extracted from DOM
   */
  private extractAlbumsFromDOM(): Album[] {
    const albums = this.musicGridItemElements
      .map((gridItem) => this.extractAlbumFromGridItem(gridItem))
      .filter((album): album is Album => album !== null);

    console.log(
      '[MusicPage]',
      'Extracted',
      albums.length,
      'albums from ".music-grid-item" DOM elements',
    );

    return albums;
  }

  /**
   * Extracts album data from a single music grid item
   * @param gridItem - The individual music grid item element
   * @returns Album object or null if extraction fails
   */
  private extractAlbumFromGridItem(gridItem: HTMLElement): Album | null {
    try {
      // Extract album URL
      const linkElement = element('a', gridItem) as HTMLAnchorElement;
      if (!linkElement) {
        throw new Error('No album link found in grid item');
      }

      const urlValue = linkElement.getAttribute('href');
      if (!urlValue) {
        throw new Error('No album URL found in grid item');
      }

      const normalizedAlbumUrl = this.normalizeUrl(urlValue);
      const itemId = this.extractDataFromDataItemId(gridItem);

      // Only process albums, skip tracks
      if (itemId.type !== 'album') {
        throw new Error(
          `Expected "album" type item id, but got "${itemId.value}"`,
        );
      }

      const albumId = itemId.id;

      // Extract title with improved handling
      const title = this.extractTitleFromGridItem(gridItem);

      // Extract artist with improved logic
      const artist = this.extractArtistFromGridItem(gridItem);

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
    } catch (error) {
      console.warn(
        '[MusicPage]',
        'Error extracting album from grid item\n',
        error,
      );
      return null;
    }
  }

  /**
   * Extracts title from grid item with improved handling of newlines
   */
  private extractTitleFromGridItem(gridItem: HTMLElement): string {
    const titleElement = element('.title', gridItem) as HTMLElement;
    if (!titleElement) {
      return 'Unknown Title';
    }

    // Split by newlines and take the first part
    const titleParts = titleElement.innerText.split('\n');
    let title = titleParts[0].trim();

    // Clean the title using existing utilities
    title = trim(title, ' -\n');
    title = removeInvisibleChars(title);

    return title || 'Unknown Title';
  }

  /**
   * Extracts artist from grid item with improved fallback logic
   */
  private extractArtistFromGridItem(gridItem: HTMLElement): string {
    // First, try to get artist from artist-override element
    const artistElement = element('.artist-override', gridItem) as HTMLElement;
    let artist = artistElement?.innerText || '';

    // Clean the artist name using existing utilities
    artist = trim(artist, ' -\n');
    artist = removeInvisibleChars(artist);

    return artist || this.band.name;
  }

  /**
   * Normalizes album URL to absolute path
   * @param url - The URL (relative or absolute)
   * @returns Normalized absolute URL as Url object
   */
  private normalizeUrl(url: string): Url {
    return url.startsWith('https://')
      ? new Url(url)
      : this.band.url.withPath(url);
  }

  /**
   * Extracts data from data-item-id attribute
   * @throws Error if data-item-id is not found or invalid
   */
  private extractDataFromDataItemId(gridItem: HTMLElement): {
    type: string;
    id: number;
    value: string;
  } {
    // Try to get from data-item-id attribute first
    const value = gridItem.getAttribute('data-item-id');

    if (!value) {
      throw new Error('No data-item-id attribute found in grid item');
    }

    const match = value.match(/(\w+)-(\d+)/);

    if (!match) {
      throw new Error(
        `Invalid data-item-id format. Expected "<type>-<id>". Got "${value}"`,
      );
    }

    const type = match[1];
    const id = parseInt(match[2], 10);

    if (isNaN(id)) {
      throw new Error(
        `Invalid ID in data-item-id. Expected numeric ID. Got "${match[2]}"`,
      );
    }

    return { type, id, value };
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
    const band = BandFactory.fromRawData(
      bandData.id,
      bandData.name,
      bandData.url,
      [],
      [],
      bandMetadata,
    );

    return band;
  }
}
