import {
  containsOneOf,
  removeInvisibleChars,
  splitString,
  trim,
} from 'src/utils/string';
import { Artist } from './artist';
import { ArtistMemoryCache } from './cache';

export class ArtistFactory {
  private static cache = new ArtistMemoryCache();

  static fromString(input: string): Artist {
    const processedInput = trim(removeInvisibleChars(input), ' -\n');
    const cached = this.cache.get(processedInput);
    if (cached) {
      return cached;
    }

    const artist = this.parseArtist(processedInput);
    this.cache.set(processedInput, artist);
    return artist;
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
      artist:
        parts.length > 1
          ? this.fromString(parts[0])
          : this.fromString(defaultArtist),
      title: parts.length > 1 ? parts[1] : title,
    };
  }

  static clearCache(): void {
    this.cache.clear();
  }

  static getCacheSize(): number {
    return this.cache.size();
  }

  private static parseArtist(input: string): Artist {
    if (input === '') {
      return new Artist(['']);
    }

    const useOriginal = containsOneOf(input, ['V/A']);
    const names: string[] = useOriginal
      ? [input]
      : splitString(input, /[,/+•|]| Vs | & +/);
    const joins: string[] = useOriginal
      ? []
      : (input.match(/[,/+•|]| Vs | & +/g) || []).map((join) => join.trim());

    return new Artist(names, joins);
  }
}
