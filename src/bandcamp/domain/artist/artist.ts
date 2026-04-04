import { capitalizeWords } from 'src/utils/string';

const VARIOUS_ARTISTS = 'Various Artists';
const VARIOUS_ARTISTS_ALIASES = [
  VARIOUS_ARTISTS,
  'V/A',
  'VVAA',
  'Various',
  'Various Artist',
];

export function isVariousArtists(name: string): boolean {
  return VARIOUS_ARTISTS_ALIASES.some(
    (alias) => alias.toLowerCase() === name.toLowerCase(),
  );
}

export class Artist {
  constructor(
    public readonly names: string[],
    public readonly joins: string[] = [],
  ) {}

  get isVariousArtists(): boolean {
    return this.names.length === 1 && isVariousArtists(this.names[0]);
  }

  get asString(): string {
    return this.toString();
  }

  toString(): string {
    return (
      this.toArray()
        .join(' ')
        // Replace multiple spaces around joins with a single space
        .replace(/\s*,\s*/g, ', ')
    );
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

  static parse(input: string): Artist {
    // Handle special cases
    if (input === '') {
      return new Artist([input]);
    }

    // Handle special case for "Various Artists"
    if (isVariousArtists(input)) {
      return new Artist([VARIOUS_ARTISTS]);
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
        names.push(capitalizeWords(part));
      } else {
        // Odd indices are delimiters/joins
        joins.push(part);
      }
    }

    return new Artist(names, joins);
  }
}
