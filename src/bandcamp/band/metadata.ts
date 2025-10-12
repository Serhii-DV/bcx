import type { StorableObject, StorageObject } from 'src/core/storage';
import type { Album } from '../album';
import type { Track } from '../track/track';

export class BandMetadata implements StorableObject {
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
    return BandMetadata.create(
      data.created,
      data.currency,
      data.albums || [],
      data.tracks || [],
    );
  }
}
