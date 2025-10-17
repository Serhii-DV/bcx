import type { StorableObject, StorageObject } from 'src/core/storage';
import { Price } from './price';

export class Metadata implements StorableObject {
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
    return {
      price: this.price.toStorageObject(),
      publisher: this.publisher,
      published: this.published.toISOString(),
      modified: this.modified.toISOString(),
      keywords: this.keywords,
    };
  }

  static fromStorageObject(data: StorageObject): Metadata {
    return Metadata.create(
      Price.create(data.price.amount, data.price.currency),
      data.publisher,
      data.published,
      data.modified,
      data.keywords,
    );
  }
}
