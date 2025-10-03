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
    public sellingBandId: number,
    public metadata?: AlbumMetadata,
  ) {}

  static create(
    url: string | Url,
    artist: string,
    title: string,
    id: string | number,
    art_id: string | number,
    sellingBandId: string | number,
    metadata?: AlbumMetadata,
  ): Album {
    return new Album(
      typeof url === 'string' ? new Url(url) : url,
      Artist.fromString(artist),
      removeInvisibleChars(title),
      typeof id === 'string' ? parseInt(id.replace('album-', '')) : id,
      new Artwork(typeof art_id === 'string' ? parseInt(art_id) : art_id),
      typeof sellingBandId === 'string'
        ? parseInt(sellingBandId)
        : sellingBandId,
      metadata,
    );
  }

  toStorageObject(): StorageObject {
    return {
      url: this.url.toString(),
      artist: this.artist.toString(),
      title: this.title,
      id: this.id,
      art_id: this.artwork.id,
      sellingBandId: this.sellingBandId,
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
      data.art_id,
      data.sellingBandId,
      data.metadata
        ? AlbumMetadata.fromStorageObject(data.metadata)
        : undefined,
    );
  }
}
