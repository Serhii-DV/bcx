import type { ParsedReleaseMetadata } from 'src/utils/releaseMetadata';
import { parseReleaseMetadata } from 'src/utils/releaseMetadata';
import { removeInvisibleChars } from 'src/utils/string';
import type { Artist } from '../artist/artist';
import { ArtistFactory } from '../artist/factory';
import { Artwork } from '../artwork/artwork';
import { getPropertyValueByName, type MusicAlbumSchema } from '../page/schema';
import { TrackFactory } from '../track/factory';
import type { Track } from '../track/track';
import type { Album } from './album';
import { getReleaseMetadataFromAlbum } from './helper';

export class AlbumDetails {
  constructor(
    public readonly url: string,
    public readonly artist: Artist,
    public readonly title: string,
    public readonly artwork: Artwork,
    public readonly tracks: Track[],
    public readonly tags: string[],
    public readonly publisher: string,
    public readonly publishedDate: string,
    public readonly modifiedDate: string,
    public readonly releaseMetadata: ParsedReleaseMetadata,
  ) {}

  get year(): number | undefined {
    return this.releaseMetadata.releaseYear;
  }

  get displayTitle(): string {
    const year = this.year ? ` (${this.year})` : '';
    return `${this.artist.toString()} - ${this.title}${year}`;
  }

  static fromMusicAlbumSchema(schema: MusicAlbumSchema): AlbumDetails {
    const title = removeInvisibleChars(schema.name);
    const releaseMetadata = parseReleaseMetadata(title);
    releaseMetadata.releaseYear ??= this.createYear(schema.datePublished);

    return new AlbumDetails(
      schema.mainEntityOfPage,
      ArtistFactory.create(schema.byArtist.name),
      title,
      this.createArtwork(schema),
      TrackFactory.createTracksFromMusicAlbumSchema(schema),
      schema.keywords || [],
      schema.publisher.name,
      this.createDate(schema.datePublished),
      this.createDate(schema.dateModified),
      releaseMetadata,
    );
  }

  static fromAlbum(album: Album): AlbumDetails {
    return new AlbumDetails(
      album.url.toString(),
      album.artist,
      album.title,
      album.artwork,
      album.tracks,
      album.metadata?.keywords || [],
      album.metadata?.publisher || '',
      album.metadata?.publishedDate || '',
      album.metadata?.modifiedDate || '',
      getReleaseMetadataFromAlbum(album),
    );
  }

  private static createArtwork(schema: MusicAlbumSchema): Artwork {
    const digitalRelease = schema.albumRelease.find(
      (release) => release.musicReleaseFormat === 'DigitalFormat',
    );
    const artworkId = getPropertyValueByName(
      digitalRelease?.additionalProperty,
      'art_id',
    );

    if (typeof artworkId === 'number') {
      return Artwork.createForAlbum(artworkId);
    }

    return Artwork.fromUrl(schema.image) || Artwork.createForAlbum(0);
  }

  private static createDate(date: string): string {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toISOString().split('T')[0];
  }

  private static createYear(date: string): number | undefined {
    const year = new Date(date).getFullYear();

    return Number.isNaN(year) ? undefined : year;
  }
}
