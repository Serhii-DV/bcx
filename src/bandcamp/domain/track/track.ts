import type { Url } from 'src/core/url';
import type { Artist } from '../artist/artist';
import type { Artwork } from '../artwork/artwork';
import type { Metadata } from '../metadata';
import type { RawTrackData } from './data';
import { TrackTime } from './time';

export class Track {
  constructor(
    public id: number,
    public position: number,
    public artist: Artist,
    public title: string,
    public artwork: Artwork,
    public url?: Url,
    public time?: TrackTime,
    public albumId?: number,
    public metadata?: Metadata,
  ) {}

  get isRelease(): boolean {
    return this.albumId !== undefined;
  }

  toString(): string {
    return `${this.artist} - ${this.title}`;
  }

  toAlbumTrackString(): string {
    return `${this.position}. ${this.toString()} ${this.time ? '(' + this.time.toReadableString() + ')' : ''}`;
  }

  toRawData(): RawTrackData {
    return {
      id: this.id,
      position: this.position,
      artist: this.artist.toString(),
      title: this.title,
      artworkId: this.artwork.id,
      url: this.url?.toString(),
      time: this.time?.toString(),
      albumId: this.albumId,
      metadata: this.metadata?.toRawData(),
    };
  }
}
