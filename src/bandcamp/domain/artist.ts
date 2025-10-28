import {
  containsOneOf,
  removeInvisibleChars,
  splitString,
  trim,
} from 'src/utils/string';

export class Artist {
  public names: string[];
  public joins: string[];

  constructor(names: string[], joins: string[] = []) {
    this.names = names;
    this.joins = joins.map((join) => join.trim());
  }

  toString(): string {
    return this.toArray().join(' ');
  }

  toArray(): string[] {
    const result: string[] = [];
    for (let i = 0; i < this.names.length; i++) {
      result.push(this.names[i]);
      if (i < this.joins.length) {
        result.push(this.joins[i]);
      }
    }
    return result;
  }

  static fromString(input: string): Artist {
    if (input === undefined) {
      return new Artist(['']);
    }

    input = trim(input, ' -\n');
    input = removeInvisibleChars(input);

    const useOriginal = containsOneOf(input, ['V/A']);
    const names: string[] = useOriginal
      ? [input]
      : splitString(input, /[,/+•|]| Vs | & +/);
    const joins: string[] = useOriginal
      ? []
      : (input.match(/[,/+•|]| Vs | & +/g) || []).map((join) => join.trim());
    return new Artist(names, joins);
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
          ? Artist.fromString(parts[0])
          : Artist.fromString(defaultArtist),
      title: parts.length > 1 ? parts[1] : title,
    };
  }
}
