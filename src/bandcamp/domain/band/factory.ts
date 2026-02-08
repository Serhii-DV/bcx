import { decompress } from '../compressor';
import { bandDataCompressor } from '../shared';
import { Band } from './band';
import { type CompressedBandData, type RawBandData } from './compressor';
import { BandMetadata } from './metadata';

export class BandFactory {
  static fromRawData(rawData: RawBandData): Band {
    return Band.create(
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
