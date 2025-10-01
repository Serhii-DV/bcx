import type { HasStorageObject, StorageObject } from 'src/core/storage';
import { Price } from './price';

export class AlbumMetadata implements HasStorageObject {
  constructor(
    public price: Price,
    public label: string,
    public published: Date,
    public modified: Date,
    public keywords: string[],
  ) {}

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
    return new AlbumMetadata(
      Price.fromStorageObject(data.price),
      data.label,
      new Date(data.published),
      new Date(data.modified),
      data.keywords,
    );
  }
}
