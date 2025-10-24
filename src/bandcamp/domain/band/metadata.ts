import type { StorableObject, StorageObject } from 'src/core/storage';
import type { Album } from '../album/album';
import { type Compressable, compress, decompress } from '../compressor';
import type { Track } from '../track/track';
import {
  BandMetadataCompressor,
  type CompressedBandMetadata,
  type RawBandMetadata,
} from './metadataCompressor';

export class BandMetadata implements StorableObject, Compressable {
  public readonly compressor = new BandMetadataCompressor();

  constructor(
    public created: Date,
    public currency: string,
    public albums: Album[],
    public tracks: Track[],
  ) {}

  static create(
    created: string | Date,
    currency: string,
    albums: Album[] = [],
    tracks: Track[] = [],
  ): BandMetadata {
    return new BandMetadata(
      created instanceof Date ? created : new Date(created),
      currency,
      albums,
      tracks,
    );
  }

  toStorageObject(): StorageObject {
    return compress(this);
  }

  toRawData(): RawBandMetadata {
    return {
      created: this.created.toISOString(),
      currency: this.currency,
      // Save Album IDs instead of full Album objects to avoid redundancy
      albums: this.albums.map((album) => album.id),
      // Save Track IDs instead of full Track objects to avoid redundancy
      tracks: this.tracks.map((track) => track.id),
    };
  }

  static fromStorageObject(data: StorageObject): BandMetadata {
    // Note: albums and tracks arrays will contain IDs, not full objects
    // The actual Album and Track objects should be reconstructed elsewhere
    const metadata = decompress(
      data as CompressedBandMetadata,
      new BandMetadataCompressor(),
    ) as RawBandMetadata;
    return BandMetadata.create(metadata.created, metadata.currency, [], []);
  }
}
