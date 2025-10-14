import type { StorableObject, StorageObject } from 'src/core/storage';
import { Price } from '../core/price';

export class AlbumMetadata implements StorableObject {
  constructor(
    public price: Price,
    public label: string,
    public published: Date,
    public modified: Date,
    public keywords: string[],
  ) {}

  year(): number {
    return this.published.getFullYear();
  }

  static create(
    amount: string | number,
    currency: string,
    label: string,
    published: string,
    modified: string,
    keywords: string[],
  ): AlbumMetadata {
    return new AlbumMetadata(
      Price.create(amount, currency),
      label,
      new Date(published),
      new Date(modified),
      keywords,
    );
  }

  toStorageObject(): StorageObject {
    return {
      price: this.price.toStorageObject(),
      label: this.label,
      published: this.published.toISOString(),
      modified: this.modified.toISOString(),
      keywords: this.keywords,
    };
  }

  static fromStorageObject(data: StorageObject): AlbumMetadata {
    return AlbumMetadata.create(
      data.price.amount,
      data.price.currency,
      data.label,
      data.published,
      data.modified,
      data.keywords,
    );
  }
}
