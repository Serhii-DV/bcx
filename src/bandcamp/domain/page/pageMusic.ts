import { arrayUnique, createQueryCountMap } from 'src/utils/array';
import { getExtensionUrl } from 'src/utils/chrome.runtime';
import { console } from 'src/utils/console';
import { element, elementHtml, elements, injectCssFile } from 'src/utils/dom';
import { removeInvisibleChars, trim } from 'src/utils/string';
import type { QueryCountMap } from '$lib/components/bcx';
import { Album } from '../album/album';
import { Artwork } from '../artwork/artwork';
import { Band } from '../band/band';
import { BandMetadata } from '../band/metadata';
import { BandcampStorage } from '../storage';
import { TrackFactory } from '../track/factory';
import { Track } from '../track/track';
import type { BandPage } from './BandPage';
import { createMetadataElement, createQueryCountBadgeElement } from './helper';

interface MusicGridClientItem {
  art_id: number;
  artist: string;
  band_id: number;
  id: number;
  page_url: string;
  title: string;
  type: string;
}

type Release = Album | Track;

let pageMusic: PageMusic | null = null;

export class PageMusic implements BandPage {
  public musicGridElement: HTMLElement | null = null;
  public musicGridItemElements: HTMLElement[];
  public queryCountMap: QueryCountMap = new Map();
  public readonly album: null = null;
  public readonly albumDetails: null = null;

  private constructor(public readonly band: Band) {
    elementHtml()?.classList.add('bcx-page-music');

    this.musicGridElement = element('#music-grid');
    if (!this.musicGridElement) {
      console.log('[PageMusic]', 'No #music-grid found on this page');
    }

    this.musicGridItemElements = elements(
      '.music-grid-item',
      this.musicGridElement,
    );
  }

  static async init(): Promise<PageMusic> {
    console.log('[PageMusic]', 'init()');

    if (pageMusic instanceof PageMusic) {
      return pageMusic;
    }

    await injectCssFile(getExtensionUrl('bandcamp.content.page.music.css'));

    const band = this.createBand();
    pageMusic = new PageMusic(band);
    await pageMusic.initReleases();

    console.log('[PageMusic]', '[band]', pageMusic.band);

    pageMusic.queryCountMap = createQueryCountMap(
      pageMusic.band.metadata.queries,
    );
    pageMusic.appendMetadataToReleases();

    return pageMusic;
  }

  private async initReleases(): Promise<void> {
    const releases = this.findReleases();
    const albums = releases.filter(
      (release): release is Album => release instanceof Album,
    );
    this.band.metadata.albums = await BandcampStorage.getAlbums(albums);
    this.band.metadata.tracks = releases.filter(
      (release): release is Track => release instanceof Track,
    );
  }

  private appendMetadataToReleases(): void {
    this.band.metadata.albums.forEach((album) => {
      const gridItem = element(
        `.music-grid-item[data-item-id="album-${album.id}"]`,
        this.musicGridElement,
      );
      if (!gridItem) return;

      const albumMetadataElement = this.createAlbumMetadataElement(album);
      gridItem.insertAdjacentElement('beforeend', albumMetadataElement);
    });

    this.band.metadata.trackReleases.forEach((track) => {
      const gridItem = element(
        `.music-grid-item[data-item-id="track-${track.id}"]`,
        this.musicGridElement,
      );
      if (!gridItem) return;

      const trackMetadataElement = this.createTrackMetadataElement(track);
      gridItem.insertAdjacentElement('beforeend', trackMetadataElement);
    });
  }

  private createBadgeWithCount(
    query: string,
    title: string,
    className?: string,
  ): HTMLElement {
    const count = this.queryCountMap.get(query) || 0;
    return createQueryCountBadgeElement(query, count, title, className);
  }

  private createYearBadgeElement(year: number): HTMLElement {
    return createQueryCountBadgeElement(
      year.toString(),
      1,
      'Filter by year',
      'bcx-badge-year',
    );
  }

  private createArtistNameBadgeElement(artistName: string): HTMLElement {
    return this.createBadgeWithCount(
      artistName,
      'Filter by artist',
      'bcx-badge-artist',
    );
  }

  private createKeywordBadgeElement(keyword: string): HTMLElement {
    return this.createBadgeWithCount(
      keyword,
      'Filter by keyword',
      'bcx-badge-keyword',
    );
  }

  private createAlbumMetadataElement(album: Album): HTMLElement {
    const metadataElement = createMetadataElement();

    // Show album year first
    if (album.metadata?.year) {
      const badge = this.createYearBadgeElement(album.metadata.year);
      metadataElement.appendChild(badge);
    }

    // Output artist names
    arrayUnique(album.artistNames)
      .sort()
      .map((artistName) => this.createArtistNameBadgeElement(artistName))
      .forEach((badge) => {
        metadataElement.appendChild(badge);
      });

    // Keywords
    album.metadata?.keywords
      .map((keyword) => this.createKeywordBadgeElement(keyword))
      .forEach((badge) => {
        metadataElement.appendChild(badge);
      });

    return metadataElement;
  }

  private createTrackMetadataElement(track: Track): HTMLElement {
    const metadataElement = createMetadataElement();

    // Show album year first
    if (track.metadata?.year) {
      const badge = this.createYearBadgeElement(track.metadata.year);
      metadataElement.appendChild(badge);
    }

    // Artist names
    arrayUnique(track.artist?.names || [])
      .sort()
      .map((artistName) => this.createArtistNameBadgeElement(artistName))
      .forEach((badge) => {
        metadataElement.appendChild(badge);
      });

    // Keywords
    track.metadata?.keywords
      .map((keyword) => this.createKeywordBadgeElement(keyword))
      .forEach((badge) => {
        metadataElement.appendChild(badge);
      });

    return metadataElement;
  }

  /**
   * Finds and extracts all releases on the current page
   * @returns Array of Release objects found on the page
   */
  private findReleases(): Release[] {
    // It looks like clientItems data attribute doesn't contain "featured" releases
    // We can't use this method. Let's use this method as a fallback.

    const albums = this.extractReleasesFromDOM();

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
        '[PageMusic]',
        'No dataset.clientItems found, extracting from DOM elements',
      );

      return [];
    }

    try {
      const items: MusicGridClientItem[] = JSON.parse(clientItemsData);

      console.log(
        '[PageMusic]',
        'Music grid client items has',
        items.length,
        'items',
      );

      const albums = items
        .map((item) => this.createAlbumFromClientItem(item))
        .filter((album): album is Album => album !== null);

      console.log(
        '[PageMusic]',
        'Extracted',
        albums.length,
        'albums from music grid client items data',
      );

      return albums;
    } catch (error) {
      console.warn('[PageMusic]', 'Failed to parse client items data:', error);
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
  private extractReleasesFromDOM(): Release[] {
    const releases = this.musicGridItemElements
      .map((gridItem) => this.extractReleaseFromGridItem(gridItem))
      .filter((release): release is Release => release !== null);

    console.log(
      '[PageMusic]',
      'Extracted',
      releases.length,
      'releases from ".music-grid-item" DOM elements',
    );

    return releases;
  }

  /**
   * Extracts release data from a single music grid item
   * @param gridItem - The individual music grid item element
   * @returns Release object or null if extraction fails
   */
  private extractReleaseFromGridItem(gridItem: HTMLElement): Release | null {
    try {
      // Extract release URL
      const linkElement = element('a', gridItem) as HTMLAnchorElement;
      if (!linkElement) {
        throw new Error('No release link found in grid item');
      }

      const urlValue = linkElement.getAttribute('href');
      if (!urlValue) {
        throw new Error('No release URL found in grid item');
      }

      const url = this.normalizeUrl(urlValue);
      const itemId = this.extractDataFromDataItemId(gridItem);

      if (itemId.type !== 'album' && itemId.type !== 'track') {
        throw new Error(
          `Unsupported item type "${itemId.type}" in data-item-id attribute`,
        );
      }

      // Extract title with improved handling
      const title = this.extractTitleFromGridItem(gridItem);
      // Extract artist with improved logic
      const artist = this.extractArtistFromGridItem(gridItem);
      // Extract optional IDs with fallbacks
      const artworkId = this.extractArtworkIdFromElement(gridItem) || 0;
      const bandId = this.extractBandIdFromElement(gridItem) || this.band.id;

      switch (itemId.type) {
        case 'album':
          return Album.create(url, artist, title, itemId.id, artworkId, bandId);

        case 'track':
          return TrackFactory.create(
            itemId.id,
            1, // position is not available in DOM, set it to 1 for now
            artist,
            title,
            artworkId,
            url,
            '00:00:00',
          );
      }
    } catch (error) {
      console.warn(
        '[PageMusic]',
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
  private normalizeUrl(url: string): string {
    return url.startsWith('https://')
      ? url
      : this.band.url.withPath(url).toString();
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
    const img = element('img', gridItem);
    if (!img) {
      return null;
    }

    const src = img.classList.contains('lazy')
      ? img.dataset['original']
      : img.getAttribute('src');

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

  private static createBand(): Band {
    const bandData = JSON.parse(
      element('[data-band]')?.dataset?.band || 'null',
    );

    if (!bandData) {
      throw new Error('No band data found on this page');
    }

    const linkElement = element('link[rel="image_src"]') as HTMLLinkElement;
    const artwork = Artwork.fromUrl(linkElement!.href || '');

    return Band.create(
      bandData.id,
      bandData.name,
      bandData.url,
      artwork ? artwork.id : 0,
      BandMetadata.create(bandData.create_date, bandData.currency),
    );
  }
}
