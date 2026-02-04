import type { Storable, StorableData, StorageObject } from 'src/core/storage';
import type { Url } from 'src/core/url';
import type { Artwork } from '../artwork/artwork';
import { type Compressable, compress } from '../compressor';
import { bandDataCompressor } from '../shared';
import { StorageKey } from '../storageKey';
import { BandcampUrlFactory } from '../url/factory';
import { BandDataCompressor, type RawBandData } from './compressor';
import type { BandMetadata } from './metadata';

export class Band implements Storable, Compressable {
  constructor(
    public id: number,
    public name: string,
    public url: Url,
    public artwork: Artwork,
    public metadata: BandMetadata,
  ) {
    this.url = BandcampUrlFactory.createBandUrl(url);
  }

  get hasReleases(): boolean {
    return (
      this.metadata.albums.length > 0 || this.metadata.trackReleases.length > 0
    );
  }

  get compressor(): BandDataCompressor {
    return bandDataCompressor;
  }

  toStorableData(): StorableData {
    const key = StorageKey.bandKey(this.id);
    const urlKey = this.url.uuid;
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
      artworkId: this.artwork.id,
      metadata: this.metadata.toRawData(),
    };
  }
}
