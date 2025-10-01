import type { HasStorageObject, StorageObject } from 'src/core/storage';

export class AlbumMetadata implements HasStorageObject {
  constructor(
    public label: string,
    public published: Date,
    public modified: Date,
    public keywords: string[],
  ) {}

  toStorageObject(): StorageObject {
    return {
      label: this.label,
      published: this.published.toISOString(),
      modified: this.modified.toISOString(),
      keywords: this.keywords,
    };
  }

  static fromStorageObject(data: StorageObject): AlbumMetadata {
    return new AlbumMetadata(
      data.label,
      new Date(data.published),
      new Date(data.modified),
      data.keywords,
    );
  }
}
