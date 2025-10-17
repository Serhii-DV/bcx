import type { Storable, StorableData, StorageObject } from 'src/core/storage';
import { removeInvisibleChars } from 'src/utils/string';
import { Artist } from '../artist';
import { Artwork } from '../artwork';
import { Metadata } from '../metadata';
import { StorageKey } from '../storageKey';
import { Url } from '../url';

export class Album implements Storable {
  constructor(
    public url: Url,
    public artist: Artist,
    public title: string,
    public id: number,
    public artwork: Artwork,
    public bandId: number,
    public metadata?: Metadata,
  ) {}

  toString(): string {
    const year =
      this.metadata instanceof Metadata ? ` (${this.metadata.year})` : '';
    return `${this.artist.toString()} - ${this.title}${year}`;
  }

  static create(
    url: string | Url,
    artist: string,
    title: string,
    id: string | number,
    artworkId: string | number,
    bandId: string | number,
    metadata?: Metadata,
  ): Album {
    return new Album(
      typeof url === 'string' ? new Url(url) : url,
      Artist.fromString(artist),
      removeInvisibleChars(title),
      typeof id === 'string' ? parseInt(id.replace('album-', '')) : id,
      new Artwork(
        typeof artworkId === 'string' ? parseInt(artworkId) : artworkId,
      ),
      typeof bandId === 'string' ? parseInt(bandId) : bandId,
      metadata,
    );
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
    return {
      url: this.url.toString(),
      artist: this.artist.toString(),
      title: this.title,
      id: this.id,
      artworkId: this.artwork.id,
      bandId: this.bandId,
      metadata: this.metadata ? this.metadata.toStorageObject() : undefined,
    };
  }

  static fromStorageObject(data: StorageObject): Album {
    return Album.create(
      data.url,
      data.artist,
      data.title,
      data.id,
      data.artworkId,
      data.bandId,
      data.metadata ? Metadata.fromStorageObject(data.metadata) : undefined,
    );
  }
}
