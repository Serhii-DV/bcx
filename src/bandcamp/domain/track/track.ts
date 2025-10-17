import type { Storable, StorableData } from 'src/core/storage';
import type { Artist } from '../artist';
import type { Artwork } from '../artwork';
import type { Metadata } from '../metadata';
import { StorageKey } from '../storageKey';
import { Url } from '../url';
import { TrackTime } from './time';

export class Track implements Storable {
  constructor(
    public id: number,
    public url: Url,
    public artist: Artist,
    public title: string,
    public time: TrackTime,
    public artwork: Artwork,
    public albumId?: number,
    public metadata?: Metadata,
  ) {}

  toStorableData(): StorableData {
    const key = StorageKey.trackKey(this.id);
    const urlKey = StorageKey.urlKey(this.url);
    return {
      [key]: this.toStorageObject(),
      [urlKey]: key,
    };
  }

  toStorageObject(): StorableData {
    return {
      id: this.id,
      url: this.url.toString(),
      artist: this.artist.toString(),
      title: this.title,
      time: this.time.toString(),
      artId: this.artwork.id,
      albumId: this.albumId,
      metadata: this.metadata?.toStorageObject(),
    };
  }
}
