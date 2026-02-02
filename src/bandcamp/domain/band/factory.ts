import { removeInvisibleChars, trim } from 'src/utils/string';
import { Artwork } from '../artwork/artwork';
import { decompress } from '../compressor';
import { bandDataCompressor } from '../shared';
import { Url } from '../url/url';
import { Band } from './band';
import { type CompressedBandData, type RawBandData } from './compressor';
import { BandMetadata } from './metadata';

export class BandFactory {
  static create(
    id: number,
    name: string,
    url: Url,
    artwork: Artwork,
    metadata: BandMetadata,
  ): Band {
    return new Band(id, name, url, artwork, metadata);
  }

  static fromRawData(rawData: RawBandData): Band {
    const bandId =
      typeof rawData.id === 'string' ? parseInt(rawData.id, 10) : rawData.id;
    const bandName = trim(removeInvisibleChars(rawData.name), ' -\n');
    const bandUrl = new Url(rawData.url);
    const metadata = BandMetadata.fromRawData(rawData.metadata);

    return new Band(
      bandId,
      bandName,
      bandUrl,
      Artwork.createForBand(rawData.artworkId),
      metadata,
    );
  }

  static createRawData(compressedData: CompressedBandData): RawBandData {
    return decompress(compressedData, bandDataCompressor) as RawBandData;
  }
}
