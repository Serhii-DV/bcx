import type { StorableObject, StorageObject } from 'src/core/storage';
import { type Compressable, compress, decompress } from './compressor';
import {
  type CompressedPriceData,
  PriceDataCompressor,
  type RawPriceData,
} from './priceCompressor';
import { priceDataCompressor } from './shared';

export class Price implements StorableObject, Compressable {
  public readonly compressor = new PriceDataCompressor();

  constructor(
    public amount: number,
    public currency: string,
  ) {}

  static create(amount: string | number, currency: string): Price {
    if (typeof amount === 'string') {
      amount = parseFloat(amount);
    }
    return new Price(amount, currency);
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  toString(): string {
    return `${this.amount} ${this.currency}`;
  }

  toStorageObject(): StorageObject {
    return compress(this);
  }

  toRawData(): RawPriceData {
    return {
      amount: this.amount,
      currency: this.currency,
    };
  }

  static fromRawData(rawData: RawPriceData): Price {
    return Price.create(rawData.amount, rawData.currency);
  }

  static fromStorageObject(data: StorageObject): Price {
    const decompressed = decompress(
      data as CompressedPriceData,
      priceDataCompressor,
    ) as RawPriceData;
    return Price.create(decompressed.amount, decompressed.currency);
  }
}
