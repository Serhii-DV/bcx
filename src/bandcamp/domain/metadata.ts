import type { StorableObject, StorageObject } from 'src/core/storage';
import { type Compressable, compress, decompress } from './compressor';
import {
  type CompressedMetadataData,
  MetadataCompressor,
  type RawMetadataData,
} from './metadataCompressor';
import { Price } from './price';

export class Metadata implements StorableObject, Compressable {
  public readonly compressor = new MetadataCompressor();

  constructor(
    public price: Price,
    public publisher: string,
    public published: Date,
    public modified: Date,
    public keywords: string[],
  ) {}

  get year(): number {
    return this.published.getFullYear();
  }

  get publishedDate(): string {
    return this.published.toISOString().split('T')[0];
  }

  static create(
    price: Price,
    publisher: string,
    published: string,
    modified: string,
    keywords: string[] = [],
  ): Metadata {
    return new Metadata(
      price,
      publisher,
      new Date(published),
      new Date(modified),
      keywords,
    );
  }

  toStorageObject(): StorageObject {
    return compress(this);
  }

  toRawData(): RawMetadataData {
    return {
      price: this.price.toRawData(),
      publisher: this.publisher,
      published: this.published.toISOString(),
      modified: this.modified.toISOString(),
      keywords: this.keywords,
    };
  }

  static fromRawData(rawData: RawMetadataData): Metadata {
    return Metadata.create(
      Price.fromRawData(rawData.price),
      rawData.publisher,
      rawData.published,
      rawData.modified,
      rawData.keywords || [],
    );
  }

  static fromStorageObject(data: StorageObject): Metadata {
    const decompressed = decompress(
      data as CompressedMetadataData,
      new MetadataCompressor(),
    ) as RawMetadataData;

    return Metadata.create(
      Price.create(decompressed.price.amount, decompressed.price.currency),
      decompressed.publisher,
      decompressed.published,
      decompressed.modified,
      decompressed.keywords,
    );
  }
}
