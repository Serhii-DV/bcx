import type { Storable, StorableData, StorageObject } from 'src/core/storage';
import { arrayUnique } from 'src/utils/array';
import type { Album } from '../album/album';
import { type Compressable, compress } from '../compressor';
import { bandDataCompressor } from '../shared';
import { StorageKey } from '../storageKey';
import type { Track } from '../track/track';
import type { Url } from '../url/url';
import { BandDataCompressor, type RawBandData } from './compressor';
import type { BandMetadata } from './metadata';

export class Band implements Storable, Compressable {
  constructor(
    public id: number,
    public name: string,
    public url: Url,
    public metadata: BandMetadata,
  ) {}

  get hasReleases(): boolean {
    return this.metadata.albums.length > 0 || this.metadata.tracks.length > 0;
  }

  get artistNames(): string[] {
    return arrayUnique(this.artistNamesAll).sort();
  }

  get artistNamesAll(): string[] {
    const artistNames: string[] = [];

    // Collect all artists from albums
    this.metadata.albums.forEach((album: Album) => {
      artistNames.push(...album.artist.names);
    });

    this.metadata.tracks.forEach((track: Track) => {
      artistNames.push(...track.artist.names);
    });

    return artistNames;
  }

  get years(): string[] {
    return arrayUnique(this.yearsAll).sort();
  }

  get yearsAll(): string[] {
    const years: number[] = [];

    this.metadata.albums.forEach((album: Album) => {
      const year = album.metadata?.year;
      if (year) {
        years.push(year);
      }
    });

    return years.map((year) => year.toString());
  }

  get keywords(): string[] {
    return arrayUnique(this.keywordsAll).sort();
  }

  get keywordsAll(): string[] {
    const keywords: string[] = [];

    this.metadata.albums.forEach((album: Album) => {
      keywords.push(...(album.metadata?.keywords || []));
    });

    this.metadata.tracks.forEach((track: Track) => {
      keywords.push(...(track.metadata?.keywords || []));
    });

    return keywords;
  }

  get compressor(): BandDataCompressor {
    return bandDataCompressor;
  }

  toStorableData(): StorableData {
    const key = StorageKey.bandKey(this.id);
    const urlKey = StorageKey.urlKey(this.url);
    const bandData: StorableData = {
      [key]: this.toStorageObject(),
      [urlKey]: key,
    };

    return bandData;
  }

  toStorageObject(): StorageObject {
    return compress(this);
  }

  toRawData(): RawBandData {
    return {
      id: this.id,
      name: this.name,
      url: this.url.toString(),
      metadata: this.metadata.toRawData(),
    };
  }
}
