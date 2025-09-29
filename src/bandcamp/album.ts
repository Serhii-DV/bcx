import type { AlbumMetadata } from './albumMetadata';
import { Artist } from './artist';
import { Url } from './url';

export class Album {
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
    id: string,
    metadata?: AlbumMetadata,
  ): Album {
    return new Album(
      new Url(url),
      Artist.fromString(artist),
      title,
      image,
      parseInt(id.replace('album-', '')),
      metadata,
    );
  }
}
