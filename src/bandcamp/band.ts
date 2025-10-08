import type { Storable, StorableData, StorageObject } from 'src/core/storage';
import { removeInvisibleChars, trim } from 'src/utils/string';
import { Album } from './album';
import { BandMetadata } from './bandMetadata';
import { Url } from './url';

export class Band implements Storable {
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

  toStorableData(): StorableData {
    const key = 'band.' + this.id;
    return {
      [key]: this.toStorageObject(),
      [this.url.uuid]: key,
    };
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
