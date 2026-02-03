import type { Storable, StorableData, StorageObject } from 'src/core/storage';
import type { Url } from 'src/core/url';
import type { Artist } from '../artist/artist';
import { Artwork } from '../artwork/artwork';
import { type Compressable, compress } from '../compressor';
import { Metadata } from '../metadata';
import { albumDataCompressor } from '../shared';
import { StorageKey } from '../storageKey';
import type { Track } from '../track/track';
import { AlbumDataCompressor, type RawAlbumData } from './compressor';

export class Album implements Storable, Compressable {
  constructor(
    public url: Url,
    public artist: Artist,
    public title: string,
    public id: number,
    public artwork: Artwork,
    public bandId: number,
    public tracks: Track[] = [],
    public metadata?: Metadata,
  ) {}

  get compressor(): AlbumDataCompressor {
    return albumDataCompressor;
  }

  toString(): string {
    const year =
      this.metadata instanceof Metadata ? ` (${this.metadata.year})` : '';
    return `${this.artist.toString()} - ${this.title}${year}`;
  }

  toStorableData(): StorableData {
    const key = StorageKey.albumKey(this.id);
    const urlKey = this.url.uuid;
    return {
      [key]: this.toStorageObject(),
      [urlKey]: key,
    };
  }

  toStorageObject(): StorageObject {
    return compress(this);
  }

  toRawData(): RawAlbumData {
    return {
      id: this.id,
      url: this.url.toString(),
      artist: this.artist.toString(),
      title: this.title,
      artworkId: this.artwork.id,
      bandId: this.bandId,
      // Save Track IDs instead of full Track objects to avoid redundancy
      trackIds: this.tracks.map((track) => track.id),
      metadata: this.metadata?.toRawData(),
    };
  }
}
