import type { StorageObject } from 'src/core/storage';
import type { CompressedData, Compressor, RawData } from '../compressor';
import { UrlCompressor } from '../urlCompressor';

export interface RawBandData extends RawData {
  id: number;
  name: string;
  url: string;
  metadata: StorageObject;
}

export interface CompressedBandData extends CompressedData {
  i: number; // id
  n: string; // name
  u: string; // compressed url
  m: StorageObject; // metadata
}

export class BandDataCompressor implements Compressor {
  compress(data: RawBandData): CompressedBandData {
    return {
      i: data.id,
      n: data.name,
      u: UrlCompressor.compress(data.url),
      m: data.metadata,
    };
  }

  decompress(data: CompressedBandData): RawBandData {
    return {
      id: data.i,
      name: data.n,
      url: UrlCompressor.expand(data.u),
      metadata: data.m,
    };
  }
}
