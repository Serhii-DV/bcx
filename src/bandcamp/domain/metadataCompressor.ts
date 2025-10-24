import type { CompressedData, Compressor } from './compressor';
import {
  type CompressedPriceData,
  PriceDataCompressor,
  type RawPriceData,
} from './priceCompressor';

export interface RawMetadataData extends CompressedData {
  price: RawPriceData;
  publisher: string;
  published: string;
  modified: string;
  keywords: string[];
}

export interface CompressedMetadataData extends CompressedData {
  p: CompressedPriceData; // price
  b: string; // publisher
  d: string; // published
  m: string; // modified
  k: string[]; // keywords
}

export class MetadataCompressor implements Compressor {
  private readonly priceCompressor = new PriceDataCompressor();

  compress(data: RawMetadataData): CompressedMetadataData {
    return {
      p: this.priceCompressor.compress(data.price),
      b: data.publisher,
      d: data.published,
      m: data.modified,
      k: data.keywords,
    };
  }

  decompress(data: CompressedMetadataData): RawMetadataData {
    return {
      price: this.priceCompressor.decompress(data.p),
      publisher: data.b,
      published: data.d,
      modified: data.m,
      keywords: data.k,
    };
  }
}
