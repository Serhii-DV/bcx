import { Album } from 'src/bandcamp/domain/album/album';
import { Metadata } from 'src/bandcamp/domain/metadata';
import { console } from 'src/utils/console';
import { element } from 'src/utils/dom';
import { Price } from '../price';
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
  constructor() {
    const schema = getMusicAlbumSchema();
    console.log('[PageAlbum]', 'Schema extracted from page:', schema);
    this.album = this.createAlbumFromSchema(schema!);
    console.log('[PageAlbum]', 'Album extracted from schema:', this.album);

    this.appendAlbumYear();
  }

  /**
   * Creates an Album object from a Bandcamp Schema JSON-LD data
   */
  private createAlbumFromSchema(schema: MusicAlbumSchema): Album {
    // Extract the album ID from the main digital release
    const digitalRelease = schema.albumRelease.find(
      (release: AlbumRelease) => release.musicReleaseFormat === 'DigitalFormat',
    );

    const url = schema.mainEntityOfPage;
    const artist = schema.byArtist.name;
    const title = schema.name;

    const albumId =
      (digitalRelease?.additionalProperty.find(
        (prop: PropertyValue) => prop.name === 'item_id',
      )?.value as number) || 0;

    const artworkId =
      (digitalRelease?.additionalProperty.find(
        (prop: PropertyValue) => prop.name === 'art_id',
      )?.value as number) || 0;

    // Some albums may not have a selling_band_id (e.g. compilations)
    // Default to 0 in such cases

    const bandId =
      (digitalRelease?.additionalProperty.find(
        (prop: PropertyValue) => prop.name === 'selling_band_id',
      )?.value as number) || 0;

    const price = new Price(
      (digitalRelease?.offers.price as number) || 0,
      digitalRelease?.offers.priceCurrency || 'USD',
    );

    const metadata = Metadata.create(
      price,
      schema.publisher.name,
      schema.datePublished,
      schema.dateModified,
      schema.keywords,
    );

    return Album.create(
      url,
      artist,
      title,
      albumId,
      artworkId,
      bandId,
      metadata,
    );
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

    trackTitleElement.insertAdjacentElement('beforeend', releaseYearElement);
  }

  /**
   * Extract track information from schema
   */
  static getTracksFromSchema(schema: MusicAlbumSchema) {
    return schema.track.itemListElement.map((trackItem) => ({
      position: trackItem.position,
      name: trackItem.item.name,
      duration: trackItem.item.duration,
      url: trackItem.item.mainEntityOfPage,
      trackId: trackItem.item.additionalProperty.find(
        (prop: PropertyValue) => prop.name === 'track_id',
      )?.value as number,
    }));
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
