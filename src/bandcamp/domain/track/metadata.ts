import type { StorableData, StorableObject } from 'src/core/storage';
import type { Price } from '../price';

export class TrackMetadata implements StorableObject {
  constructor(
    public price: Price,
    public published: Date,
    public modified: Date,
  ) {}

  year(): number {
    return this.published.getFullYear();
  }

  toStorageObject(): StorableData {
    return {
      price: this.price.toString(),
      published: this.published.toISOString(),
      modified: this.modified.toISOString(),
    };
  }
}
