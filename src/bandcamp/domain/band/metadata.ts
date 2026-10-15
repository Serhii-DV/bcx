import { arrayNumberUnique, arrayUnique } from 'src/utils/array';
import { Album } from '../album/album';
import { UNKNOWN_YEAR } from '../page/pageMusic';
import { getArtistNamesFromTracks } from '../track/helper';
import { Track } from '../track/track';

export type BandRelease = Album | Track;
export type BandReleaseRef =
  | { type: 'album'; id: number }
  | { type: 'track'; id: number };

export interface RawBandMetadata {
  location?: string;
  biography?: string;
  links?: BandMetadata['links'];
  created: string;
  currency: string;
  /** Missing for unscanned bands; an empty array is authoritative. */
  releases?: BandReleaseRef[];
}

export function resolveBandReleases(
  refs: BandReleaseRef[],
  albums: Album[],
  tracks: Track[],
): BandRelease[] {
  const albumsById = new Map(albums.map((album) => [album.id, album]));
  const tracksById = new Map(tracks.map((track) => [track.id, track]));
  return refs
    .map((ref) =>
      ref.type === 'album' ? albumsById.get(ref.id) : tracksById.get(ref.id),
    )
    .filter((release): release is BandRelease => release !== undefined);
}

export class BandMetadata {
  private catalog?: BandRelease[];

  constructor(
    public created: Date,
    public currency: string,
    releases?: readonly BandRelease[],
    public location?: string,
    public biography?: string,
    public links: { label: string; url: string }[] = [],
  ) {
    if (releases !== undefined) this.releases = releases;
  }

  get releases(): readonly BandRelease[] {
    return this.catalog ?? [];
  }

  set releases(releases: readonly BandRelease[]) {
    const seen = new Set<string>();
    this.catalog = releases.filter((release) => {
      const key = `${release instanceof Album ? 'album' : 'track'}:${release.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  get albums(): Album[] {
    return this.releases.filter(
      (release): release is Album => release instanceof Album,
    );
  }

  get tracks(): Track[] {
    return this.releases.filter(
      (release): release is Track => release instanceof Track,
    );
  }

  get trackReleases(): Track[] {
    // Catalog membership comes from the band page, independently of albumId.
    return this.tracks;
  }

  /**
   * Get unique artist names associated with the band's releases, sorted alphabetically.
   */
  get artistNames(): string[] {
    return arrayUnique(this.releaseArtistNames).sort();
  }

  /**
   * Get all artist names associated with the band's releases, including duplicates.
   */
  get releaseArtistNames(): string[] {
    const artistNames: string[] = [];

    this.albums.forEach((album: Album) => {
      artistNames.push(...album.artist.names);
    });

    artistNames.push(...getArtistNamesFromTracks(this.trackReleases));

    return artistNames;
  }

  get years(): number[] {
    return arrayNumberUnique(this.releaseYears).sort();
  }

  get releaseYears(): number[] {
    const years: number[] = [];

    this.releases.forEach((release) => {
      const year = release.metadata?.year;
      if (year) {
        years.push(year);
      }
    });

    return years;
  }

  get albumsWithYears(): Album[] {
    return this.albums.filter(
      (album: Album) => album.metadata?.year !== undefined,
    );
  }

  get albumsWithoutYears(): Album[] {
    return this.albums.filter(
      (album: Album) => album.metadata?.year === undefined,
    );
  }

  albumsByYear(year: number): Album[] {
    return this.albums.filter((album: Album) => album.metadata?.year === year);
  }

  get keywords(): string[] {
    return arrayUnique(this.releaseKeywords).sort();
  }

  get releaseKeywords(): string[] {
    const keywords: string[] = [];

    this.albums.forEach((album: Album) => {
      keywords.push(...(album.metadata?.keywords || []));
    });

    this.trackReleases.forEach((track: Track) => {
      keywords.push(...(track.metadata?.keywords || []));
    });

    return keywords;
  }

  get queries(): string[] {
    const queries: string[] = [];
    queries.push(...this.releaseArtistNames);
    queries.push(...this.releaseKeywords);
    queries.push(...this.releaseYears.map((year) => year.toString()));
    queries.push(...this.albumsWithoutYears.map(() => UNKNOWN_YEAR));
    return queries;
  }

  static create(
    created: string | Date,
    currency: string,
    releases?: readonly BandRelease[],
    location?: string,
    biography?: string,
    links: BandMetadata['links'] = [],
  ): BandMetadata {
    return new BandMetadata(
      created instanceof Date ? created : new Date(created),
      currency,
      releases,
      location,
      biography,
      links,
    );
  }

  toRawData(): RawBandMetadata {
    return {
      created: this.created.toISOString(),
      currency: this.currency,
      location: this.location,
      biography: this.biography,
      links: this.links,
      releases: this.catalog?.map((release) => ({
        type: release instanceof Album ? 'album' : 'track',
        id: release.id,
      })),
    };
  }

  static fromRawData(
    rawData: RawBandMetadata,
    albums: Album[] = [],
    tracks: Track[] = [],
  ): BandMetadata {
    const refs = rawData.releases ?? [];
    const releases = resolveBandReleases(refs, albums, tracks);
    return BandMetadata.create(
      rawData.created,
      rawData.currency,
      // A shallow factory read has not loaded the referenced catalog yet.
      rawData.releases !== undefined &&
        (refs.length === 0 || releases.length > 0)
        ? releases
        : undefined,
      rawData.location,
      rawData.biography,
      rawData.links ?? [],
    );
  }
}
