import type { Storable, StorableData, StorageObject } from 'src/core/storage';
import { Url } from 'src/core/url';
import { capitalizeWords, removeInvisibleChars, trim } from 'src/utils/string';
import { Artwork } from '../artwork/artwork';
import { type Compressable, compress } from '../compressor';
import { bandDataCompressor } from '../shared';
import { StorageKey } from '../storageKey';
import { BandcampUrlFactory } from '../url/factory';
import { BandDataCompressor, type RawBandData } from './compressor';
import { BandMetadata } from './metadata';

export class Band implements Storable, Compressable {
  constructor(
    public id: number,
    public name: string,
    public url: Url,
    public artwork: Artwork,
    public metadata: BandMetadata,
  ) {
    this.name = capitalizeWords(trim(removeInvisibleChars(name), ' -\n'));
    this.url = BandcampUrlFactory.createBandUrl(url);
  }

  static create(
    id: string | number,
    name: string,
    url: string,
    artworkId: number,
    metadata?: BandMetadata,
  ): Band {
    const bandId = typeof id === 'string' ? parseInt(id, 10) : id;
    const bandUrl = Url.create(url);
    const bandArtwork = Artwork.createForBand(artworkId);
    const bandMetadata = metadata || new BandMetadata(new Date(), '', [], []);

    return new Band(bandId, name, bandUrl, bandArtwork, bandMetadata);
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
