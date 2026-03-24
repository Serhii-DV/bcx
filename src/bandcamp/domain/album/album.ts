import type { Storable, StorableData, StorageObject } from 'src/core/storage';
import { Url } from 'src/core/url';
import { removeInvisibleChars } from 'src/utils/string';
import { Artist, isVariousArtists } from '../artist/artist';
import { containsArtistName } from '../artist/helper';
import { Artwork } from '../artwork/artwork';
import { type Compressable, compress } from '../compressor';
import { Metadata } from '../metadata';
import { albumDataCompressor } from '../shared';
import { StorageKey } from '../storageKey';
import { getUniqueArtistNamesFromTracks } from '../track/helper';
import type { Track } from '../track/track';
import { AlbumDataCompressor, type RawAlbumData } from './compressor';

export class Album implements Storable, Compressable {
  constructor(
    public url: Url,
    public artist: Artist,
    public title: string,
    public id: number,
    public artwork: Artwork,
    public bandId: number,
    public tracks: Track[] = [],
    public metadata?: Metadata,
  ) {}

  static create(
    url: string,
    artist: string | Artist,
    title: string,
    id: string | number,
    artworkId: string | number,
    bandId: string | number,
    tracks: Track[] = [],
    metadata?: Metadata,
  ): Album {
    const albumUrl = Url.create(url);
    const albumArtist =
      artist instanceof Artist ? artist : Artist.create(artist);
    const albumTitle = removeInvisibleChars(title);
    const albumId =
      typeof id === 'string' ? parseInt(id.replace('album-', '')) : id;
    const albumArtwork = new Artwork(
      typeof artworkId === 'string' ? parseInt(artworkId) : artworkId,
    );
    const albumBandId = typeof bandId === 'string' ? parseInt(bandId) : bandId;

    return new Album(
      albumUrl,
      albumArtist,
      albumTitle,
      albumId,
      albumArtwork,
      albumBandId,
      tracks,
      metadata,
    );
  }

  containsArtistName(name: string): boolean {
    if (isVariousArtists(name) && this.artist.isVariousArtists) {
      return true;
    }

    const hasArtistName = containsArtistName(this.artist.names, name);

    if (!hasArtistName) {
      const trackArtistNames = getUniqueArtistNamesFromTracks(this.tracks);
      return containsArtistName(trackArtistNames, name);
    }

    return hasArtistName;
  }

  get compressor(): AlbumDataCompressor {
    return albumDataCompressor;
  }

  toString(): string {
    const year =
      this.metadata instanceof Metadata ? ` (${this.metadata.year})` : '';
    return `${this.artist.toString()} - ${this.title}${year}`;
  }

  toStorableData(): StorableData {
    const key = StorageKey.albumKey(this.id);
    const urlKey = this.url.uuid;
    return {
      [key]: this.toStorageObject(),
      [urlKey]: key,
    };
  }

  toStorageObject(): StorageObject {
    return compress(this);
  }

  toRawData(): RawAlbumData {
    return {
      id: this.id,
      url: this.url.toString(),
      artist: this.artist.toString(),
      title: this.title,
      artworkId: this.artwork.id,
      bandId: this.bandId,
      // Save Track IDs instead of full Track objects to avoid redundancy
      trackIds: this.tracks.map((track) => track.id),
      metadata: this.metadata?.toRawData(),
    };
  }
}
