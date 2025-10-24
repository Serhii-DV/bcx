import type { Storable, StorableData } from 'src/core/storage';
import type { Artist } from '../artist';
import type { Artwork } from '../artwork';
import { type Compressable, compress } from '../compressor';
import type { Metadata } from '../metadata';
import { trackDataCompressor } from '../shared';
import { StorageKey } from '../storageKey';
import { Url } from '../url/url';
import { type RawTrackData, TrackDataCompressor } from './compressor';
import { TrackTime } from './time';

export class Track implements Storable, Compressable {
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

  get compressor(): TrackDataCompressor {
    return trackDataCompressor;
  }

  toStorableData(): StorableData {
    const key = StorageKey.trackKey(this.id);
    const urlKey = StorageKey.urlKey(this.url);
    return {
      [key]: this.toStorageObject(),
      [urlKey]: key,
    };
  }

  toStorageObject(): StorableData {
    return compress(this);
  }

  toRawData(): RawTrackData {
    return {
      id: this.id,
      url: this.url.toString(),
      artist: this.artist.toString(),
      title: this.title,
      time: this.time.toString(),
      artworkId: this.artwork.id,
      albumId: this.albumId,
      metadata: this.metadata?.toRawData(),
    };
  }
}
