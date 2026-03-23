import { Album } from 'src/bandcamp/domain/album/album';
import { getExtensionUrl } from 'src/utils/chrome.runtime';
import { console } from 'src/utils/console';
import { element, elementHtml, injectCssFile } from 'src/utils/dom';
import { AlbumFactory } from '../album/factory';
import { BandcampStorage } from '../storage';
import { createReleaseYearElement } from './helper';
import {
  type AlbumRelease,
  getMusicAlbumSchema,
  type MusicAlbumSchema,
} from './schema';

let pageAlbum: PageAlbum | null = null;

export class PageAlbum {
  /**
   * @throws Error if schema is not found or invalid
   */
  private constructor(public album: Album) {
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
    pageAlbum = new PageAlbum(album);
    await pageAlbum.loadTracksFromStorage();

    console.log('[PageAlbum]', '[Album]', pageAlbum.album);

    pageAlbum.appendAlbumYear();

    return pageAlbum;
  }

  private async loadTracksFromStorage(): Promise<void> {
    this.album.tracks = await BandcampStorage.getTracks(this.album.tracks);
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

  /**
   * Extract pricing information from schema
   */
  static getPricingFromSchema(schema: MusicAlbumSchema) {
    return schema.albumRelease.map((release: AlbumRelease) => ({
      format: release.musicReleaseFormat,
      name: release.name,
      price: release.offers.price,
      currency: release.offers.priceCurrency,
      availability: release.offers.availability,
      description: release.description,
      images: release.image,
    }));
  }

  /**
   * Extract publisher/label information from schema
   */
  static getPublisherFromSchema(schema: MusicAlbumSchema) {
    return {
      name: schema.publisher.name,
      url: schema.publisher['@id'],
      description: schema.publisher.description,
      genre: schema.publisher.genre,
      location: schema.publisher.foundingLocation.name,
      image: schema.publisher.image,
      socialLinks: schema.publisher.mainEntityOfPage.map((page) => ({
        name: page.name,
        url: page.url,
      })),
    };
  }
}
