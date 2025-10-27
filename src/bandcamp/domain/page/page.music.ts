import { arrayUnique } from 'src/utils/array';
import { getExtensionUrl } from 'src/utils/chrome.runtime';
import { console } from 'src/utils/console';
import { element, elementHtml, elements, injectCssFile } from 'src/utils/dom';
import { removeInvisibleChars, trim } from 'src/utils/string';
import { Album } from '../album/album';
import { AlbumFactory } from '../album/factory';
import { Band } from '../band/band';
import type { RawBandData } from '../band/compressor';
import { BandFactory } from '../band/factory';
import { BandcampStorage } from '../storage';
import { TrackFactory } from '../track/factory';
import { Track } from '../track/track';
import { Url } from '../url/url';
import { createBadgeElement, createMetadataElement } from './helper';

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

export class PageMusic {
  public band: Band;
  public musicGridElement: HTMLElement | null = null;
  public musicGridItemElements: HTMLElement[];

  private constructor() {
    elementHtml()?.classList.add('bcx-page-music');

    this.band = this.createBand();

    this.musicGridElement = element('#music-grid');
    if (!this.musicGridElement) {
      console.log('[page.music]', 'No #music-grid found on this page');
    }

    this.musicGridItemElements = elements(
      '.music-grid-item',
      this.musicGridElement,
    );
  }

  static async init(): Promise<PageMusic> {
    await injectCssFile(getExtensionUrl('bandcamp.page.music.css'));
    const pageMusic = new PageMusic();
    await pageMusic.initReleases();

    console.log('[page.music]', '[band]', pageMusic.band);

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

      this.appendBadgesToGridItem(gridItem, album);
    });

    this.band.metadata.tracks.forEach((track) => {
      const gridItem = element(
        `.music-grid-item[data-item-id="track-${track.id}"]`,
        this.musicGridElement,
      );
      if (!gridItem) return;

      this.appendBadgesToGridItem(gridItem, track);
    });
  }

  private appendBadgesToGridItem(
    gridItem: HTMLElement,
    release: Release,
  ): void {
    const badgeValues: string[] = [];

    if (release.artist) {
      release.artist.names.forEach((artistName) => {
        badgeValues.push(artistName);
      });
    }

    // For albums, also include artists from tracks
    if (release instanceof Album) {
      release.tracks.forEach((track) => {
        track.artist.names.forEach((artistName) => {
          badgeValues.push(artistName);
        });
      });
    }

    // Append release year
    if (release.metadata?.year) {
      badgeValues.push(release.metadata.year.toString());
    }

    const releaseMetadataElement = createMetadataElement();

    arrayUnique(badgeValues)
      .sort()
      .forEach((value) => {
        const badge = createBadgeElement(value);
        releaseMetadataElement.appendChild(badge);
      });

    gridItem.insertAdjacentElement('beforeend', releaseMetadataElement);
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
    return AlbumFactory.create(
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
          return AlbumFactory.create(
            url,
            artist,
            title,
            itemId.id,
            artworkId,
            bandId,
          );

        case 'track':
          return TrackFactory.create(
            itemId.id,
            url,
            artist,
            title,
            '00:00:00',
            artworkId,
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

    const rawData: RawBandData = {
      id: bandData.id,
      name: bandData.name,
      url: bandData.url,
      metadata: {
        created: bandData.create_date,
        currency: bandData.currency,
        albumIds: [],
        trackIds: [],
      },
    };

    return BandFactory.fromRawData(rawData);
  }
}
