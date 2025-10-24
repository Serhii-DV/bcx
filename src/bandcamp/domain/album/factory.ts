import type { StorageObject } from 'src/core/storage';
import { removeInvisibleChars } from 'src/utils/string';
import { Artist } from '../artist';
import { Artwork } from '../artwork';
import { decompress } from '../compressor';
import { Metadata } from '../metadata';
import type {
  AlbumRelease,
  MusicAlbumSchema,
  PropertyValue,
} from '../page/schema';
import { Price } from '../price';
import { TrackFactory } from '../track/factory';
import type { Track } from '../track/track';
import { Url } from '../url';
import { Album } from './album';
import {
  AlbumDataCompressor,
  type CompressedAlbumData,
  type RawAlbumData,
} from './compressor';

export class AlbumFactory {
  static create(
    url: string | Url,
    artist: string,
    title: string,
    id: string | number,
    artworkId: string | number,
    bandId: string | number,
    tracks: Track[] = [],
    metadata?: Metadata,
  ): Album {
    return new Album(
      typeof url === 'string' ? new Url(url) : url,
      Artist.fromString(artist),
      removeInvisibleChars(title),
      typeof id === 'string' ? parseInt(id.replace('album-', '')) : id,
      new Artwork(
        typeof artworkId === 'string' ? parseInt(artworkId) : artworkId,
      ),
      typeof bandId === 'string' ? parseInt(bandId) : bandId,
      tracks,
      metadata,
    );
  }

  static fromStorageObject(data: StorageObject): Album {
    const albumData = decompress(
      data as CompressedAlbumData,
      new AlbumDataCompressor(),
    ) as RawAlbumData;

    return this.create(
      albumData.url,
      albumData.artist,
      albumData.title,
      albumData.id,
      albumData.artworkId,
      albumData.bandId,
      [],
      albumData.metadata
        ? Metadata.fromStorageObject(albumData.metadata)
        : undefined,
    );
  }

  /**
   * Creates an Album object from a Bandcamp Schema JSON-LD data
   */
  static createFromSchema(schema: MusicAlbumSchema): Album {
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

    const tracks = TrackFactory.createTracksFromSchema(schema);

    const metadata = Metadata.create(
      price,
      schema.publisher.name,
      schema.datePublished,
      schema.dateModified,
      schema.keywords,
    );

    return this.create(
      url,
      artist,
      title,
      albumId,
      artworkId,
      bandId,
      tracks,
      metadata,
    );
  }
}
