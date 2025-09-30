import type { HasStorageData, StorageObject } from 'src/core/storage';
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
    public metadata?: AlbumMetadata,
  ) {}

  static create(
    url: string,
    artist: string,
    title: string,
    image: string,
    id: string | number,
    metadata?: AlbumMetadata,
  ): Album {
    return new Album(
      new Url(url),
      Artist.fromString(artist),
      title,
      image,
      typeof id === 'string' ? parseInt(id.replace('album-', '')) : id,
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
      metadata: this.metadata ? this.metadata.toStorageObject() : undefined,
    };
  }

  toStorageKey(): string {
    return this.url.uuid;
  }

  fromStorageObject(data: StorageObject): this {
    this.url = new Url(data.url);
    this.artist = Artist.fromString(data.artist);
    this.title = data.title;
    this.image = data.image;
    this.id = data.id;
    this.metadata = data.metadata
      ? AlbumMetadata.fromStorageObject(data.metadata)
      : undefined;
    return this;
  }
}
