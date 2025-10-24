import type { CompressedData, Compressor, RawData } from '../compressor';

export interface RawBandMetadata extends RawData {
  created: string;
  currency: string;
  albums: number[];
  tracks: number[];
}

export interface CompressedBandMetadata extends CompressedData {
  c: string; // created
  r: string; // currency
  a?: number[]; // albums
  t?: number[]; // tracks
}

export class BandMetadataCompressor implements Compressor {
  compress(data: RawBandMetadata): CompressedBandMetadata {
    return {
      c: data.created,
      r: data.currency,
      a: data.albums.length ? data.albums : undefined,
      t: data.tracks.length ? data.tracks : undefined,
    };
  }

  decompress(data: CompressedBandMetadata): RawBandMetadata {
    return {
      created: data.c,
      currency: data.r,
      albums: data.a || [],
      tracks: data.t || [],
    };
  }
}
