import type { Storable, StorableData, StorageObject } from 'src/core/storage';
import { removeInvisibleChars, trim } from 'src/utils/string';
import { Album } from './album';
import { BandMetadata } from './bandMetadata';
import { StorageKey } from './storageKey';
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
    const key = StorageKey.bandKey(this.id);
    const urlKey = StorageKey.urlKey(this.url);
    const bandData: StorableData = {
      [key]: this.toStorageObject(),
      [urlKey]: key,
    };

    // Add storable data for each album
    for (const album of this.albums) {
      const albumStorableData = album.toStorableData();
      Object.assign(bandData, albumStorableData);
    }

    return bandData;
  }

  toStorageObject(): StorageObject {
    return {
      id: this.id,
      name: this.name,
      url: this.url.toString(),
      // Save Album IDs instead of full Album objects to avoid redundancy
      albums: this.albums.map((album) => album.id),
      metadata: this.metadata.toStorageObject(),
    };
  }

  static fromStorageObject(band: StorageObject, albums: StorageObject[]): Band {
    return Band.create(
      band.id,
      band.name,
      band.url,
      albums.map((album: StorageObject) => Album.fromStorageObject(album)),
      BandMetadata.fromStorageObject(band.metadata),
    );
  }
}
