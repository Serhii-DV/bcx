import type { HasStorageData } from 'src/core/storage';
import { removeInvisibleChars, trim } from 'src/utils/string';
import { Album } from './album';
import { Url } from './url';

export class Band implements HasStorageData {
  constructor(
    public url: Url,
    public name: string,
    public albums: Album[],
  ) {}

  static create(url: string | Url, name: string, albums: Album[]): Band {
    return new Band(
      url instanceof Url ? url : new Url(url),
      trim(removeInvisibleChars(name), ' -\n'),
      albums,
    );
  }

  toStorageObject(): object {
    return {
      url: this.url.toString(),
      name: this.name,
      albums: this.albums.map((album) => album.toStorageObject()),
    };
  }

  toStorageKey(): string {
    return this.url.uuid;
  }

  static fromStorageObject(data: any): Band {
    return Band.create(
      data.url,
      data.name,
      data.albums.map((albumData: any) => Album.fromStorageObject(albumData)),
    );
  }
}
