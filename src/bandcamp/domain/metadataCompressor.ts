import type { CompressedData, RawDataCompressor } from './compressor';
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

export class MetadataCompressor implements RawDataCompressor {
  constructor(private priceDataCompressor: PriceDataCompressor) {}

  compress(data: RawMetadataData): CompressedMetadataData {
    return {
      p: this.priceDataCompressor.compress(data.price),
      b: data.publisher,
      d: data.published,
      m: data.modified,
      k: data.keywords,
    };
  }

  decompress(data: CompressedMetadataData): RawMetadataData {
    return {
      price: this.priceDataCompressor.decompress(data.p),
      publisher: data.b,
      published: data.d,
      modified: data.m,
      keywords: data.k,
    };
  }
}
