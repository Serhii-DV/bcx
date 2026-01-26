import type { CompressedData, RawData, RawDataCompressor } from '../compressor';
import type { UrlCompressor } from '../url/compressor';
import type { RawBandMetadata } from './metadataCompressor';

export interface RawBandData extends RawData {
  id: number;
  name: string;
  url: string;
  metadata: RawBandMetadata;
}

export interface CompressedBandData extends CompressedData {
  i: number; // id
  n: string; // name
  u: string; // compressed url
  m: RawBandMetadata; // metadata
}

export class BandDataCompressor implements RawDataCompressor {
  constructor(private urlCompressor: UrlCompressor) {}

  compress(data: RawBandData): CompressedBandData {
    return {
      i: data.id,
      n: data.name,
      u: this.urlCompressor.compress(data.url),
      m: data.metadata,
    };
  }

  decompress(data: CompressedBandData): RawBandData {
    return {
      id: data.i,
      name: data.n,
      url: this.urlCompressor.decompress(data.u),
      metadata: data.m,
    };
  }
}
