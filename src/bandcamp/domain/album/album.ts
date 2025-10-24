import type { Storable, StorableData, StorageObject } from 'src/core/storage';
import { Artist } from '../artist';
import { Artwork } from '../artwork';
import { type Compressable, compress } from '../compressor';
import { Metadata } from '../metadata';
import { StorageKey } from '../storageKey';
import type { Track } from '../track/track';
import { Url } from '../url/url';
import { AlbumDataCompressor, type RawAlbumData } from './compressor';

export class Album implements Storable, Compressable {
  public readonly compressor = new AlbumDataCompressor();

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

  toString(): string {
    const year =
      this.metadata instanceof Metadata ? ` (${this.metadata.year})` : '';
    return `${this.artist.toString()} - ${this.title}${year}`;
  }

  toStorableData(): StorableData {
    const key = StorageKey.albumKey(this.id);
    const urlKey = StorageKey.urlKey(this.url);
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
