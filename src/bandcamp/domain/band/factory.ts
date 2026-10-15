import type { Album } from '../album/album';
import type { MusicAlbumSchema } from '../page/schema';
import type { Track } from '../track/track';
import { Band } from './band';
import type { RawBandData } from './data';
import { BandMetadata } from './metadata';

export class BandFactory {
  static fromRawData(
    rawData: RawBandData,
    albums: Album[] = [],
    tracks: Track[] = [],
  ): Band {
    return Band.create(
      rawData.id,
      rawData.name,
      rawData.url,
      rawData.artworkId,
      BandMetadata.fromRawData(rawData.metadata, albums, tracks),
    );
  }

  static fromMusicAlbumSchema(schema: MusicAlbumSchema): Band {
    return Band.create(
      schema.publisher.additionalProperty.find((prop) => prop.name === 'bandId')
        ?.value as number,
      schema.publisher.name,
      schema.publisher['@id'],
      schema.publisher.additionalProperty.find(
        (prop) => prop.name === 'image_id',
      )?.value as number,
    );
  }
}
