import type { ReleaseNotes } from './album/releaseNotes';
import type { RawPriceData } from './price';
import { Price } from './price';

export interface RawMetadataData {
  price: RawPriceData;
  publisher: string;
  published: string;
  modified: string;
  keywords: string[];
  release?: ReleaseNotes;
}

export class Metadata {
  constructor(
    public price: Price,
    public publisher: string,
    public published: Date,
    public modified: Date,
    public keywords: string[],
    public release?: ReleaseNotes,
  ) {}

  get year(): number | undefined {
    return Number.isFinite(this.published.getTime())
      ? this.published.getFullYear()
      : undefined;
  }

  get publishedDate(): string {
    return Number.isFinite(this.published.getTime())
      ? this.published.toISOString().split('T')[0]
      : '';
  }

  get modifiedDate(): string {
    return Number.isFinite(this.modified.getTime())
      ? this.modified.toISOString().split('T')[0]
      : '';
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

  toRawData(): RawMetadataData {
    return {
      price: this.price.toRawData(),
      publisher: this.publisher,
      published: Number.isFinite(this.published.getTime())
        ? this.published.toISOString()
        : '',
      modified: Number.isFinite(this.modified.getTime())
        ? this.modified.toISOString()
        : '',
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
}
