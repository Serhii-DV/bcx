import type { Storable, StorableData, StorageObject } from 'src/core/storage';
import { StorageKey } from '../storageKey';
import type { Url } from '../url';
import type { BandMetadata } from './metadata';

export class Band implements Storable {
  constructor(
    public id: number,
    public name: string,
    public url: Url,
    public metadata: BandMetadata,
  ) {}

  get hasReleases(): boolean {
    return this.metadata.albums.length > 0 || this.metadata.tracks.length > 0;
  }

  toStorableData(): StorableData {
    const key = StorageKey.bandKey(this.id);
    const urlKey = StorageKey.urlKey(this.url);
    const bandData: StorableData = {
      [key]: this.toStorageObject(),
      [urlKey]: key,
    };

    // Add storable data for each album
    for (const album of this.metadata.albums) {
      const albumStorableData = album.toStorableData();
      Object.assign(bandData, albumStorableData);
    }

    // Add storable data for each track
    for (const track of this.metadata.tracks) {
      const trackStorableData = track.toStorableData();
      Object.assign(bandData, trackStorableData);
    }

    return bandData;
  }

  toStorageObject(): StorageObject {
    return {
      id: this.id,
      name: this.name,
      url: this.url.toString(),
      metadata: this.metadata.toStorageObject(),
    };
  }
}
