import type { StorageObject } from 'src/core/storage';
import { removeInvisibleChars, trim } from 'src/utils/string';
import { Album } from '../album';
import { TrackFactory } from '../track/factory';
import { Track } from '../track/track';
import { Url } from '../url';
import { Band } from './band';
import { BandMetadata } from './metadata';

export class BandFactory {
  static create(
    id: number,
    name: string,
    url: Url,
    albums: Album[],
    tracks: Track[],
    metadata: BandMetadata,
  ): Band {
    return new Band(id, name, url, albums, tracks, metadata);
  }

  static fromRawData(
    id: string | number,
    name: string,
    url: string | Url,
    albums: Album[],
    tracks: Track[],
    metadata: BandMetadata,
  ): Band {
    const bandId = typeof id === 'string' ? parseInt(id, 10) : id;
    const bandName = trim(removeInvisibleChars(name), ' -\n');
    const bandUrl = url instanceof Url ? url : new Url(url);

    return new Band(bandId, bandName, bandUrl, albums, tracks, metadata);
  }

  static fromStorage(
    band: StorageObject,
    albums: StorageObject[],
    tracks: StorageObject[],
  ): Band {
    return BandFactory.fromRawData(
      band.id,
      band.name,
      band.url,
      albums.map((album: StorageObject) => Album.fromStorageObject(album)),
      tracks.map((track: StorageObject) => TrackFactory.fromStorage(track)),
      BandMetadata.fromStorageObject(band.metadata),
    );
  }
}
