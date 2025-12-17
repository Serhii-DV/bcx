import { console } from 'src/utils/console';
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
    const cached = this.cache.get(input);
    if (cached) {
      return cached;
    }

    const artist = this.parseArtist(input);
    this.cache.set(input, artist);
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

    const processedInput = trim(removeInvisibleChars(input), ' -\n');

    const useOriginal = containsOneOf(processedInput, ['V/A']);

    if (processedInput === 'God Body Disconnect') {
      console.log('ArtistFactory.parseArtist - before split', {
        input: processedInput,
        useOriginal,
        regex: /[,/+•|]| Vs | & +/,
      });
    }

    const names: string[] = useOriginal
      ? [processedInput]
      : splitString(processedInput, /[,/+•|]| Vs | & +/);
    const joins: string[] = useOriginal
      ? []
      : (processedInput.match(/[,/+•|]| Vs | & +/g) || []).map((join) =>
          join.trim(),
        );

    if (processedInput === 'God Body Disconnect') {
      console.log('ArtistFactory.parseArtist - after split', {
        input: processedInput,
        names: names,
        namesLength: names.length,
        joins: joins,
      });
    }

    return new Artist(names, joins);
  }
}
