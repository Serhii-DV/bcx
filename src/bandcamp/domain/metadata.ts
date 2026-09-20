import type { StorableObject, StorageObject } from 'src/core/storage';
import type { ReleaseNotes } from './album/releaseNotes';
import { type Compressable, compress, decompress } from './compressor';
import {
  type CompressedMetadataData,
  MetadataCompressor,
  type RawMetadataData,
} from './metadataCompressor';
import { Price } from './price';
import { metadataCompressor } from './shared';

export class Metadata implements StorableObject, Compressable {
  constructor(
    public price: Price,
    public publisher: string,
    public published: Date,
    public modified: Date,
    public keywords: string[],
    public release?: ReleaseNotes,
  ) {}

  get compressor(): MetadataCompressor {
    return metadataCompressor;
  }

  get year(): number {
    return this.published.getFullYear();
  }

  get publishedDate(): string {
    return this.published.toISOString().split('T')[0];
  }

  get modifiedDate(): string {
    return this.modified.toISOString().split('T')[0];
  }

  static create(
    price: Price,
    publisher: string,
    published: string,
    modified: string,
    keywords: string[] = [],
    release?: ReleaseNotes,
  ): Metadata {
    return new Metadata(
      price,
      publisher,
      new Date(published),
      new Date(modified),
      keywords,
      release,
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
      release: this.release,
    };
  }

  static fromRawData(rawData: RawMetadataData): Metadata {
    return Metadata.create(
      Price.fromRawData(rawData.price),
      rawData.publisher,
      rawData.published,
      rawData.modified,
      rawData.keywords || [],
      rawData.release,
    );
  }

  static fromStorageObject(data: StorageObject): Metadata {
    const decompressed = decompress(
      data as CompressedMetadataData,
      metadataCompressor,
    ) as RawMetadataData;

    return Metadata.create(
      Price.create(decompressed.price.amount, decompressed.price.currency),
      decompressed.publisher,
      decompressed.published,
      decompressed.modified,
      decompressed.keywords,
      decompressed.release,
    );
  }
}
