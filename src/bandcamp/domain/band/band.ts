import type { Storable, StorableData, StorageObject } from 'src/core/storage';
import { type Compressable, compress } from '../compressor';
import { StorageKey } from '../storageKey';
import type { Url } from '../url';
import { BandDataCompressor, type RawBandData } from './compressor';
import type { BandMetadata } from './metadata';

export class Band implements Storable, Compressable {
  public readonly compressor = new BandDataCompressor();

  constructor(
    public id: number,
    public name: string,
    public url: Url,
    public metadata: BandMetadata,
  ) {}

  get hasReleases(): boolean {
    return this.metadata.albums.length > 0 || this.metadata.tracks.length > 0;
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
      metadata: this.metadata.toStorageObject(),
    };
  }
}
