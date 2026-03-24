import type { StorageObject } from 'src/core/storage';
import { Artist } from '../artist/artist';
import { decompress } from '../compressor';
import { Metadata } from '../metadata';
import type {
  AlbumRelease,
  MusicAlbumSchema,
  PropertyValue,
} from '../page/schema';
import { Price } from '../price';
import { albumDataCompressor } from '../shared';
import { TrackFactory } from '../track/factory';
import { getUniqueArtistNamesFromTracks } from '../track/helper';
import { Album } from './album';
import { type CompressedAlbumData, type RawAlbumData } from './compressor';
export class AlbumFactory {
  static fromRawData(rawData: RawAlbumData): Album {
    return Album.create(
      rawData.url,
      rawData.artist,
      rawData.title,
      rawData.id,
      rawData.artworkId,
      rawData.bandId,
      [],
      rawData.metadata ? Metadata.fromRawData(rawData.metadata) : undefined,
    );
  }

  static createRawData(compressedData: CompressedAlbumData): RawAlbumData {
    return decompress(compressedData, albumDataCompressor) as RawAlbumData;
  }

  static fromCompressedData(compressedData: CompressedAlbumData): Album {
    const rawData = this.createRawData(compressedData);

    return this.fromRawData(rawData);
  }

  static fromStorage(data: StorageObject): Album {
    return this.fromCompressedData(data as CompressedAlbumData);
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
    const title = schema.name;
    const tracks = TrackFactory.createTracksFromMusicAlbumSchema(schema);
    const artistsFromTracks = getUniqueArtistNamesFromTracks(tracks);
    const artist =
      artistsFromTracks.length > 1
        ? new Artist(artistsFromTracks)
        : Artist.create(schema.byArtist.name);

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
      tracks,
      metadata,
    );
  }
}
