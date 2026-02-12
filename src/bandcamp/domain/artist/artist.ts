import { removeInvisibleChars, trim } from 'src/utils/string';
import { ArtistMemoryCache } from './cache';

export class Artist {
  public readonly joins: string[];

  private _stringCache?: string;
  private static cache = new ArtistMemoryCache();

  constructor(
    public readonly names: string[],
    joins: string[] = [],
  ) {
    // Trim whitespace from joins
    this.joins = joins.map((join) => join.trim());
  }

  toString(): string {
    if (this._stringCache === undefined) {
      this._stringCache = this.toArray().join(' ');
    }
    return this._stringCache;
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

  static create(input: string): Artist {
    const processedInput = trim(removeInvisibleChars(input), ' -\n');
    const cached = this.cache.get(processedInput);

    if (cached) {
      return cached;
    }

    const artist = this.parse(processedInput);
    this.cache.set(processedInput, artist);

    return artist;
  }

  private static parse(input: string): Artist {
    // Handle special cases
    if (input === '' || input === 'V/A') {
      return new Artist([input]);
    }

    // Define delimiters to split on
    const delimiters = [
      ',',
      '&',
      '|',
      '/',
      '+',
      '•',
      'Vs',
      'vs',
      'VS',
      'feat.',
      'ft.',
      'featuring',
    ];

    // Create a regex pattern to match delimiters with optional spaces
    const delimiterPattern = delimiters
      .map((delimiter) => delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape special regex chars
      .join('|');

    const regex = new RegExp(`\\s*(${delimiterPattern})\\s*`, 'gi');

    const parts = input.split(regex);
    const names: string[] = [];
    const joins: string[] = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]?.trim();
      if (!part) continue;

      if (i % 2 === 0) {
        // Even indices are artist names
        names.push(part);
      } else {
        // Odd indices are delimiters/joins
        joins.push(part);
      }
    }

    return new Artist(names, joins);
  }
}
