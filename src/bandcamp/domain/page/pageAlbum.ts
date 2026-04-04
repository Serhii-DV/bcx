import { Album } from 'src/bandcamp/domain/album/album';
import { console } from 'src/utils/console';
import { element, elementHtml } from 'src/utils/dom';
import { AlbumFactory } from '../album/factory';
import type { Band } from '../band/band';
import { BandFactory } from '../band/factory';
import { BandcampStorage } from '../storage';
import { createReleaseYearElement } from './helper';
import { getMusicAlbumSchema } from './schema';

let pageAlbum: PageAlbum | null = null;

export class PageAlbum {
  /**
   * @throws Error if schema is not found or invalid
   */
  private constructor(
    public readonly album: Album,
    public readonly band: Band,
  ) {
    elementHtml()?.classList.add('bcx-page-album');
  }

  static async init(): Promise<PageAlbum> {
    if (pageAlbum) {
      return pageAlbum;
    }

    console.log('[PageAlbum]', 'Initializing PageAlbum');

    const schema = getMusicAlbumSchema();
    console.log('[PageAlbum]', '[Schema]', schema);

    const album = AlbumFactory.createFromSchema(schema!);
    const bands = await BandcampStorage.getBands([album.bandId]);
    const band = bands[0] ?? BandFactory.fromMusicAlbumSchema(schema!);

    pageAlbum = new PageAlbum(album, band);
    pageAlbum.appendAlbumYear();

    console.log('[PageAlbum]', '[Album]', pageAlbum.album);
    console.log('[PageAlbum]', '[Band]', pageAlbum.band);

    await BandcampStorage.saveAlbum(album);

    return pageAlbum;
  }

  private appendAlbumYear(): void {
    const trackTitleElement = element('#name-section .trackTitle');

    if (!trackTitleElement || !this.album.metadata?.year) {
      return;
    }

    const releaseYearElement = createReleaseYearElement(
      this.album.metadata.year,
      this.album.metadata.publishedDate,
    );

    trackTitleElement.insertAdjacentElement('afterend', releaseYearElement);
  }
}
