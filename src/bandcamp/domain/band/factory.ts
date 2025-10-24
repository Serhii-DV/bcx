import { removeInvisibleChars, trim } from 'src/utils/string';
import { decompress } from '../compressor';
import { Url } from '../url';
import { Band } from './band';
import {
  BandDataCompressor,
  type CompressedBandData,
  type RawBandData,
} from './compressor';
import { BandMetadata } from './metadata';

export class BandFactory {
  static create(
    id: number,
    name: string,
    url: Url,
    metadata: BandMetadata,
  ): Band {
    return new Band(id, name, url, metadata);
  }

  static fromRawData(rawData: RawBandData): Band {
    const bandId =
      typeof rawData.id === 'string' ? parseInt(rawData.id, 10) : rawData.id;
    const bandName = trim(removeInvisibleChars(rawData.name), ' -\n');
    const bandUrl = new Url(rawData.url);
    const metadata = BandMetadata.fromRawData(rawData.metadata);

    return new Band(bandId, bandName, bandUrl, metadata);
  }

  static createRawData(compressedData: CompressedBandData): RawBandData {
    return decompress(compressedData, new BandDataCompressor()) as RawBandData;
  }
}
