import { Url } from 'src/core/url';
import { removeInvisibleChars, trim } from 'src/utils/string';
import { Artwork } from '../artwork/artwork';
import { decompress } from '../compressor';
import { bandDataCompressor } from '../shared';
import { Band } from './band';
import { type CompressedBandData, type RawBandData } from './compressor';
import { BandMetadata } from './metadata';

export class BandFactory {
  static create(
    id: string | number,
    name: string,
    url: string,
    artworkId: number,
    metadata?: BandMetadata,
  ): Band {
    const bandId = typeof id === 'string' ? parseInt(id, 10) : id;
    const bandName = trim(removeInvisibleChars(name), ' -\n');
    const bandUrl = Url.create(url);
    const bandArtwork = Artwork.createForBand(artworkId);
    const bandMetadata = metadata || new BandMetadata(new Date(), '', [], []);

    return new Band(bandId, bandName, bandUrl, bandArtwork, bandMetadata);
  }

  static fromRawData(rawData: RawBandData): Band {
    return this.create(
      rawData.id,
      rawData.name,
      rawData.url,
      rawData.artworkId,
      BandMetadata.fromRawData(rawData.metadata),
    );
  }

  static createRawData(compressedData: CompressedBandData): RawBandData {
    return decompress(compressedData, bandDataCompressor) as RawBandData;
  }
}
