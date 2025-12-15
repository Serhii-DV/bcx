import type { Storable, StorableData, StorageObject } from 'src/core/storage';
import type { Album } from '../album/album';
import { type Compressable, compress } from '../compressor';
import { bandDataCompressor } from '../shared';
import { StorageKey } from '../storageKey';
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
    const artistNames = new Set<string>();

    // Collect unique artists from albums
    this.metadata.albums.forEach((album: Album) => {
      album.artist.names.forEach((name: string) => artistNames.add(name));
    });

    return Array.from(artistNames).sort();
  }

  get years(): number[] {
    const years = new Set<number>();

    this.metadata.albums.forEach((album: Album) => {
      const year = album.metadata?.year;
      if (year) {
        years.add(year);
      }
    });

    return Array.from(years).sort((a, b) => a - b);
  }

  get keywords(): string[] {
    const keywords = new Set<string>();

    this.metadata.albums.forEach((album: Album) => {
      album.metadata?.keywords.forEach((keyword: string) => {
        keywords.add(keyword);
      });
    });

    return Array.from(keywords).sort();
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
