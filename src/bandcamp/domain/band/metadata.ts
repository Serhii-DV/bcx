import type { StorableObject, StorageObject } from 'src/core/storage';
import { arrayUnique } from 'src/utils/array';
import type { Album } from '../album/album';
import { type Compressable, compress, decompress } from '../compressor';
import { bandMetadataCompressor } from '../shared';
import { getArtistNamesFromTracks } from '../track/helper';
import type { Track } from '../track/track';
import {
  BandMetadataCompressor,
  type CompressedBandMetadata,
  type RawBandMetadata,
} from './metadataCompressor';

export class BandMetadata implements StorableObject, Compressable {
  constructor(
    public created: Date,
    public currency: string,
    public albums: Album[],
    public tracks: Track[],
  ) {}

  get trackReleases(): Track[] {
    return this.tracks.filter((track: Track) => track.isRelease);
  }

  /**
   * Get unique artist names associated with the band's releases, sorted alphabetically.
   */
  get artistNames(): string[] {
    return arrayUnique(this.releaseArtistNames).sort();
  }

  /**
   * Get all artist names associated with the band's releases, including duplicates.
   */
  get releaseArtistNames(): string[] {
    const artistNames: string[] = [];

    this.albums.forEach((album: Album) => {
      artistNames.push(...album.artist.names);
    });

    artistNames.push(...getArtistNamesFromTracks(this.trackReleases));

    return artistNames;
  }

  get years(): string[] {
    return arrayUnique(this.releaseYears).sort();
  }

  get releaseYears(): string[] {
    const years: number[] = [];

    this.albums.forEach((album: Album) => {
      const year = album.metadata?.year;
      if (year) {
        years.push(year);
      }
    });

    return years.map((year) => year.toString());
  }

  get keywords(): string[] {
    return arrayUnique(this.releaseKeywords).sort();
  }

  get releaseKeywords(): string[] {
    const keywords: string[] = [];

    this.albums.forEach((album: Album) => {
      keywords.push(...(album.metadata?.keywords || []));
    });

    this.trackReleases.forEach((track: Track) => {
      keywords.push(...(track.metadata?.keywords || []));
    });

    return keywords;
  }

  get queries(): string[] {
    const queries: string[] = [];
    queries.push(...this.releaseArtistNames);
    queries.push(...this.releaseKeywords);
    queries.push(...this.releaseYears);
    return queries;
  }

  get compressor(): BandMetadataCompressor {
    return bandMetadataCompressor;
  }

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
      albumIds: this.albums.map((album) => album.id),
      // Save Track IDs instead of full Track objects to avoid redundancy
      trackIds: this.tracks.map((track) => track.id),
    };
  }

  static fromRawData(rawData: RawBandMetadata): BandMetadata {
    return BandMetadata.create(
      rawData.created,
      rawData.currency,
      [], // Albums should be populated elsewhere
      [], // Tracks should be populated elsewhere
    );
  }

  static fromStorageObject(data: StorageObject): BandMetadata {
    // Note: albums and tracks arrays will contain IDs, not full objects
    // The actual Album and Track objects should be reconstructed elsewhere
    const metadata = decompress(
      data as CompressedBandMetadata,
      bandMetadataCompressor,
    ) as RawBandMetadata;
    return BandMetadata.create(metadata.created, metadata.currency, [], []);
  }
}
