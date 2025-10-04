import type { HasStorageObject, StorageObject } from 'src/core/storage';

export class BandMetadata implements HasStorageObject {
  constructor(
    public created: Date,
    public currency: string,
  ) {}

  static create(created: string | Date, currency: string): BandMetadata {
    return new BandMetadata(
      created instanceof Date ? created : new Date(created),
      currency,
    );
  }

  toStorageObject(): StorageObject {
    return {
      created: this.created.toISOString(),
      currency: this.currency,
    };
  }

  static fromStorageObject(data: StorageObject): BandMetadata {
    return BandMetadata.create(data.created, data.currency);
  }
}
