import { Artist } from '../../artist';
import { Url } from '../../url';

export class MusicItem {
  constructor(
    public url: Url,
    public artist: Artist,
    public title: string,
    public image: string,
  ) {}

  static create(
    url: string,
    artist: string,
    title: string,
    image: string,
  ): MusicItem {
    return new MusicItem(new Url(url), Artist.fromString(artist), title, image);
  }
}
