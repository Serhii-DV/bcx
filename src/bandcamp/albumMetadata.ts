import type { HasStorageObject, StorageObject } from 'src/core/storage';

export class AlbumMetadata implements HasStorageObject {
  constructor(
    public label: string,
    public datePublished: Date,
    public dateModified: Date,
    public keywords: string[],
    public credit: string,
    public quality: string,
  ) {}

  toStorageObject(): StorageObject {
    return {
      label: this.label,
      datePublished: this.datePublished.toISOString(),
      dateModified: this.dateModified.toISOString(),
      keywords: this.keywords,
      credit: this.credit,
      quality: this.quality,
    };
  }

  static fromStorageObject(data: StorageObject): AlbumMetadata {
    return new AlbumMetadata(
      data.label,
      new Date(data.datePublished),
      new Date(data.dateModified),
      data.keywords,
      data.credit,
      data.quality,
    );
  }
}
