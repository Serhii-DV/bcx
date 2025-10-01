import type { HasStorageObject, StorageObject } from 'src/core/storage';

export class AlbumMetadata implements HasStorageObject {
  constructor(
    public label: string,
    public datePublished: Date,
    public keywords: string[],
  ) {}

  toStorageObject(): StorageObject {
    return {
      label: this.label,
      datePublished: this.datePublished.toISOString(),
      keywords: this.keywords,
    };
  }

  static fromStorageObject(data: StorageObject): AlbumMetadata {
    return new AlbumMetadata(
      data.label,
      new Date(data.datePublished),
      data.keywords,
    );
  }
}
