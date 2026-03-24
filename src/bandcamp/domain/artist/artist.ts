import { capitalizeWords, removeInvisibleChars, trim } from 'src/utils/string';
import { ArtistMemoryCache } from './cache';

const VARIOUS_ARTISTS = 'Various Artists';
const VARIOUS_ARTISTS_ALIASES = ['V/A', 'VVAA', 'Various', 'Various Artist', 'Various Artists'];

export function isVariousArtists(name: string): boolean {
  return VARIOUS_ARTISTS_ALIASES.some(
    (alias) => alias.toLowerCase() === name.toLowerCase(),
  );
}

export class Artist {
  public readonly joins: string[];
  public readonly names: string[];

  private _stringCache?: string;
  private static cache = new ArtistMemoryCache();

  constructor(
    names: string[],
    joins: string[] = [],
  ) {
    this.names = names.map((name) => name.trim()).map(capitalizeWords);
    // Trim whitespace from joins
    this.joins = joins.map((join) => join.trim());
  }

  get isVariousArtists(): boolean {
    return this.names.length > 2 || (this.names.length === 1 && isVariousArtists(this.names[0]));
  }

  toString(): string {
    if (this._stringCache === undefined) {
      if (this.names.length > 2) {
        this._stringCache = VARIOUS_ARTISTS;
      } else {
        this._stringCache = this.toArray().join(' ');
      }
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

  static createVariousArtists(): Artist {
    return new Artist([VARIOUS_ARTISTS]);
  }

  private static parse(input: string): Artist {
    // Handle special cases
    if (input === '') {
      return new Artist([input]);
    }

    // Handle special case for "Various Artists"
    if (isVariousArtists(input)) {
      return Artist.createVariousArtists();
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
