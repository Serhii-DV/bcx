import type { CompressedData, Compressor, RawData } from '../compressor';

export interface RawBandMetadata extends RawData {
  created: string;
  currency: string;
  albumIds: number[];
  trackIds: number[];
}

export interface CompressedBandMetadata extends CompressedData {
  c: string; // created
  r: string; // currency
  a?: number[]; // albumIds
  t?: number[]; // trackIds
}

export class BandMetadataCompressor implements Compressor {
  compress(data: RawBandMetadata): CompressedBandMetadata {
    return {
      c: data.created,
      r: data.currency,
      a: data.albumIds.length ? data.albumIds : undefined,
      t: data.trackIds.length ? data.trackIds : undefined,
    };
  }

  decompress(data: CompressedBandMetadata): RawBandMetadata {
    return {
      created: data.c,
      currency: data.r,
      albumIds: data.a || [],
      trackIds: data.t || [],
    };
  }
}
