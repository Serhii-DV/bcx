import { storage } from 'src/core/shared';
import { element } from 'src/utils/dom';
import { Album } from '../album';
import { Band } from '../band';
import { BandMetadata } from '../bandMetadata';
import type { Url } from '../url';

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

  constructor() {
    this.band = this.createBand();
    this.band.albums = this.findAlbums();
    storage.save(this.band);
  }

  /**
   * Finds and extracts all albums from the music grid on the current page
   * @returns Array of Album objects found on the page
   */
  private findAlbums(): Album[] {
    const items: Album[] = [];
    const clientItems = JSON.parse(
      element('#music-grid')?.dataset?.clientItems || '[]',
    );

    const musicGridElement = element('#music-grid');

    if (!musicGridElement) {
      console.log('No music grid found on this page');
      return items;
    }

    clientItems.forEach((item: MusicGridClientItem) => {
      let albumUrl: string | Url = '';

      if (this.band.id === item.band_id) {
        albumUrl = this.band.url.withPath(item.page_url);
      } else {
        const albumUrlElement = element(
          `[data-item-id="album-${item.id}"] a`,
          musicGridElement,
        );

        if (!albumUrlElement) {
          console.warn('No album link found for item:', item);
          return;
        }

        albumUrl = albumUrlElement.getAttribute('href') || '';
      }

      items.push(
        Album.create(
          albumUrl,
          item.artist,
          item.title,
          item.id,
          item.art_id,
          item.band_id,
        ),
      );
    });

    return items;
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
