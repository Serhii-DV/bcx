import { removeInvisibleChars, trim } from 'src/utils/string';
import { Artist } from './artist';
import { ArtistMemoryCache } from './cache';

export class ArtistFactory {
  private static cache = new ArtistMemoryCache();

  static create(input: string): Artist {
    const processedInput = trim(removeInvisibleChars(input), ' -\n');
    const cached = this.cache.get(processedInput);

    if (cached) {
      return cached;
    }

    const artist = Artist.parse(processedInput);
    return this.cache.set(processedInput, artist);
  }

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
      artist: ArtistFactory.create(parts.length > 1 ? parts[0] : defaultArtist),
      title: parts.length > 1 ? parts[1] : title,
    };
  }
}
