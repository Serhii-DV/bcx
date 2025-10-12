import type { Storable, StorableData, StorageObject } from 'src/core/storage';
import type { Album } from '../album';
import { StorageKey } from '../storageKey';
import type { Track } from '../track/track';
import type { Url } from '../url';
import type { BandMetadata } from './metadata';

export class Band implements Storable {
  constructor(
    public id: number,
    public name: string,
    public url: Url,
    public albums: Album[],
    public tracks: Track[],
    public metadata: BandMetadata,
  ) {}

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

    // Add storable data for each track
    for (const track of this.tracks) {
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
      // Save Album IDs instead of full Album objects to avoid redundancy
      albums: this.albums.map((album) => album.id),
      // Save Track IDs instead of full Track objects to avoid redundancy
      tracks: this.tracks.map((track) => track.id),
      metadata: this.metadata.toStorageObject(),
    };
  }
}
