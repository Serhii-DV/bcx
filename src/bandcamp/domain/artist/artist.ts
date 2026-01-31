export class Artist {
  private _stringCache?: string;
  public readonly joins: string[];

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

  static fromString(artistString: string): Artist {
    // Handle special case for "V/A"
    if (artistString.trim() === 'V/A') {
      return new Artist(['V/A'], []);
    }

    // Define delimiters to split on
    const delimiters = [
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

    const parts = artistString.split(regex);
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
