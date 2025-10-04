import type { HasStorageData, StorageObject } from 'src/core/storage';
import { removeInvisibleChars } from 'src/utils/string';
import { AlbumMetadata } from './albumMetadata';
import { Artist } from './artist';
import { Artwork } from './artwork';
import { Url } from './url';

export class Album implements HasStorageData {
  constructor(
    public url: Url,
    public artist: Artist,
    public title: string,
    public id: number,
    public artwork: Artwork,
    public bandId: number,
    public metadata?: AlbumMetadata,
  ) {}

  static create(
    url: string | Url,
    artist: string,
    title: string,
    id: string | number,
    artworkId: string | number,
    bandId: string | number,
    metadata?: AlbumMetadata,
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

  toStorageKey(): string {
    return this.url.uuid;
  }

  static fromStorageObject(data: StorageObject): Album {
    return Album.create(
      data.url,
      data.artist,
      data.title,
      data.id,
      data.artworkId,
      data.bandId,
      data.metadata
        ? AlbumMetadata.fromStorageObject(data.metadata)
        : undefined,
    );
  }
}
