import { Url } from 'src/core/url';
import { capitalizeWords, removeInvisibleChars, trim } from 'src/utils/string';
import { Artwork } from '../artwork/artwork';
import { BandcampUrlFactory } from '../url/factory';
import type { RawBandData } from './data';
import { BandMetadata } from './metadata';

export class Band {
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
    const bandMetadata = metadata || new BandMetadata(new Date(), '');

    return new Band(bandId, name, bandUrl, bandArtwork, bandMetadata);
  }

  get hasReleases(): boolean {
    return this.metadata.releases.length > 0;
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
