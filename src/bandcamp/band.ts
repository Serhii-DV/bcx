import type { HasStorageData, StorageObject } from 'src/core/storage';
import { removeInvisibleChars, trim } from 'src/utils/string';
import { Album } from './album';
import { BandMetadata } from './bandMetadata';
import { Url } from './url';

export class Band implements HasStorageData {
  constructor(
    public id: number,
    public name: string,
    public url: Url,
    public albums: Album[],
    public metadata: BandMetadata,
  ) {}

  static create(
    id: string | number,
    name: string,
    url: string | Url,
    albums: Album[],
    metadata: BandMetadata,
  ): Band {
    return new Band(
      typeof id === 'string' ? parseInt(id, 10) : id,
      trim(removeInvisibleChars(name), ' -\n'),
      url instanceof Url ? url : new Url(url),
      albums,
      metadata,
    );
  }

  toStorageObject(): StorageObject {
    return {
      id: this.id,
      name: this.name,
      url: this.url.toString(),
      albums: this.albums.map((album) => album.toStorageObject()),
      metadata: this.metadata.toStorageObject(),
    };
  }

  toStorageKey(): string {
    return this.url.uuid;
  }

  static fromStorageObject(data: StorageObject): Band {
    return Band.create(
      data.id,
      data.name,
      data.url,
      data.albums.map((albumData: StorageObject) =>
        Album.fromStorageObject(albumData),
      ),
      BandMetadata.fromStorageObject(data.metadata),
    );
  }
}
