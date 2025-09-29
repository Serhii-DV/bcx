import { Album } from 'src/bandcamp/album';
import { AlbumMetadata } from 'src/bandcamp/albumMetadata';
import type { AlbumRelease, PropertyValue, Schema } from './schema';

export class AlbumPage {
  /**
   * Creates an Album object from a Bandcamp Schema JSON-LD data
   */
  static createAlbumFromSchema(schema: Schema): Album {
    // Extract the album ID from the main digital release
    const digitalRelease = schema.albumRelease.find(
      (release: AlbumRelease) => release.musicReleaseFormat === 'DigitalFormat',
    );

    const albumId =
      (digitalRelease?.additionalProperty.find(
        (prop: PropertyValue) => prop.name === 'item_id',
      )?.value as number) || 0;

    // Create AlbumMetadata from schema
    const metadata = new AlbumMetadata(
      schema.publisher.name,
      new Date(schema.datePublished),
      new Date(schema.dateModified),
      schema.keywords,
      schema.creditText || '',
      'high-quality', // Default quality description
    );

    // Create Album object using the static create method
    return Album.create(
      schema.mainEntityOfPage,
      schema.byArtist.name,
      schema.name,
      schema.image,
      `album-${albumId}`,
      metadata,
    );
  }

  /**
   * Extract track information from schema
   */
  static getTracksFromSchema(schema: Schema) {
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
  static getPricingFromSchema(schema: Schema) {
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
  static getPublisherFromSchema(schema: Schema) {
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
