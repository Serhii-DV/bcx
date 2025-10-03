import type { HasStorageData, StorageObject } from 'src/core/storage';
import { removeInvisibleChars } from 'src/utils/string';
import { AlbumMetadata } from './albumMetadata';
import { Artist } from './artist';
import { Url } from './url';

export class Album implements HasStorageData {
  constructor(
    public url: Url,
    public artist: Artist,
    public title: string,
    public image: string,
    public id: number,
    public sellingBandId: number,
    public metadata?: AlbumMetadata,
  ) {}

  static create(
    url: string,
    artist: string,
    title: string,
    image: string,
    id: string | number,
    sellingBandId: string | number,
    metadata?: AlbumMetadata,
  ): Album {
    return new Album(
      new Url(url),
      Artist.fromString(artist),
      removeInvisibleChars(title),
      image,
      typeof id === 'string' ? parseInt(id.replace('album-', '')) : id,
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
      image: this.image,
      id: this.id,
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
      data.image,
      data.id,
      data.sellingBandId,
      data.metadata
        ? AlbumMetadata.fromStorageObject(data.metadata)
        : undefined,
    );
  }
}
