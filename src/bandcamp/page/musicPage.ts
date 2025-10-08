import { storage } from 'src/core/shared';
import { console } from 'src/utils/console';
import { element } from 'src/utils/dom';
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
    const albums: Album[] = [];

    if (!musicGridElement) {
      return albums;
    }

    const clientItems = JSON.parse(
      musicGridElement.dataset?.clientItems || '[]',
    );

    clientItems.forEach((item: MusicGridClientItem) => {
      const albumUrl = this.getAlbumUrl(item);

      if (!albumUrl) {
        console.warn('[MusicPage]', 'No album URL found for item:', item);
        return;
      }

      const artist = item.artist || this.band.name;

      albums.push(
        Album.create(
          albumUrl,
          artist,
          item.title,
          item.id,
          item.art_id,
          item.band_id,
        ),
      );
    });

    if (albums.length === 0) {
      console.log('[MusicPage]', 'No albums found in the music grid');
    }

    return albums;
  }

  /**
   * Determines the album URL for a given music grid item
   * @param item - The music grid client item
   * @param musicGridElement - The music grid DOM element
   * @returns The album URL as string or Url object, or empty string if not found
   */
  private getAlbumUrl(item: MusicGridClientItem): string | Url {
    if (this.band.id === item.band_id) {
      return this.band.url.withPath(item.page_url);
    } else {
      const albumUrlElement = element(
        `[data-item-id="album-${item.id}"] a`,
        this.musicGridElement,
      );

      if (!albumUrlElement) {
        return '';
      }

      return albumUrlElement.getAttribute('href') || '';
    }
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
