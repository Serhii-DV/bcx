import type { Storable, StorableData } from 'src/core/storage';
import type { Artist } from '../core/artist';
import type { Artwork } from '../core/artwork';
import { StorageKey } from '../core/storageKey';
import { Url } from '../core/url';
import type { TrackMetadata } from './metadata';
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
    public metadata?: TrackMetadata,
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
