import { Artist } from './artist';

export class ArtistFactory {
  static fromTrackTitle(
    title: string,
    defaultArtist: string,
  ): {
    artist: Artist;
    title: string;
  } {
    // Sometimes the artist name is included in the title, e.g., "Artist - Track Title"
    const parts = title.split(' - ');
    return {
      artist:
        parts.length > 1
          ? Artist.create(parts[0])
          : Artist.create(defaultArtist),
      title: parts.length > 1 ? parts[1] : title,
    };
  }
}
