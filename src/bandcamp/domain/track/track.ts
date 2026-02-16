import type { Storable, StorableData } from 'src/core/storage';
import type { Url } from 'src/core/url';
import type { Artist } from '../artist/artist';
import type { Artwork } from '../artwork/artwork';
import { type Compressable, compress } from '../compressor';
import type { Metadata } from '../metadata';
import { trackDataCompressor } from '../shared';
import { StorageKey } from '../storageKey';
import { type RawTrackData, TrackDataCompressor } from './compressor';
import { TrackTime } from './time';

export class Track implements Storable, Compressable {
  constructor(
    public id: number,
    public artist: Artist,
    public title: string,
    public artwork: Artwork,
    public url?: Url,
    public time?: TrackTime,
    public albumId?: number,
    public metadata?: Metadata,
  ) {}

  get isRelease(): boolean {
    return this.albumId !== undefined;
  }

  toString(): string {
    return `${this.artist} - ${this.title} ${this.time?.toReadableString() ?? ''}`;
  }

  get compressor(): TrackDataCompressor {
    return trackDataCompressor;
  }

  toStorableData(): StorableData {
    const key = StorageKey.trackKey(this.id);
    const data: StorableData = { [key]: this.toStorageObject() };

    if (this.url) {
      data[this.url.uuid] = key;
    }

    return data;
  }

  toStorageObject(): StorableData {
    return compress(this);
  }

  toRawData(): RawTrackData {
    return {
      id: this.id,
      artist: this.artist.toString(),
      title: this.title,
      artworkId: this.artwork.id,
      url: this.url?.toString(),
      time: this.time?.toString(),
      albumId: this.albumId,
      metadata: this.metadata?.toRawData(),
    };
  }
}
