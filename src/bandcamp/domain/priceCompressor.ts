import type { CompressedData, RawData, RawDataCompressor } from './compressor';

export interface RawPriceData extends RawData {
  amount: number;
  currency: string;
}

export interface CompressedPriceData extends CompressedData {
  a: number; // amount
  c: string; // currency
}

export class PriceDataCompressor implements RawDataCompressor {
  compress(data: RawPriceData): CompressedPriceData {
    return {
      a: data.amount,
      c: data.currency,
    };
  }

  decompress(data: CompressedPriceData): RawPriceData {
    return {
      amount: data.a,
      currency: data.c,
    };
  }
}
