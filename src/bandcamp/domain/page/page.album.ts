import { Album } from 'src/bandcamp/domain/album/album';
import { getExtensionUrl } from 'src/utils/chrome.runtime';
import { console } from 'src/utils/console';
import { element, elementHtml, injectCssFile } from 'src/utils/dom';
import { AlbumFactory } from '../album/factory';
import { createReleaseYearElement } from './helper';
import {
  type AlbumRelease,
  getMusicAlbumSchema,
  type MusicAlbumSchema,
  type PropertyValue,
} from './schema';

export class PageAlbum {
  public album: Album;

  /**
   * @throws Error if schema is not found or invalid
   */
  private constructor() {
    elementHtml()?.classList.add('bcx-page-album');

    const schema = getMusicAlbumSchema();
    console.log('[PageAlbum]', 'Schema extracted from page:', schema);
    this.album = AlbumFactory.createFromSchema(schema!);
    console.log('[PageAlbum]', 'Album extracted from schema:', this.album);

    this.appendAlbumYear();
  }

  static async init(): Promise<PageAlbum> {
    await injectCssFile(getExtensionUrl('bandcamp.page.album.css'));
    return new PageAlbum();
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
