export type ReleaseType = 'Album' | 'EP' | 'Demo';

export interface ParsedReleaseMetadata {
  artistNames?: string[];
  releaseTitle?: string;
  releaseYear?: number;
  releaseType?: ReleaseType;
  catalogNumber?: string;
}

const RELEASE_TYPES: ReleaseType[] = ['Album', 'EP', 'Demo'];

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function parseYearIfStandalone(text: string): {
  year?: number;
  cleanedText: string;
} {
  const yearMatch = text.match(/(19|20)\d{2}\s*$/);

  if (!yearMatch) {
    return { year: undefined, cleanedText: text };
  }

  const year = Number(yearMatch[0].trim());
  const beforeYear = text.slice(0, yearMatch.index).trim();
  const wordBeforeYear = beforeYear
    .split(/\s+/)
    .filter(Boolean)
    .pop()
    ?.toLowerCase();

  if (wordBeforeYear === 'of') {
    return { year: undefined, cleanedText: text };
  }

  return {
    year,
    cleanedText: normalizeText(beforeYear),
  };
}

function parseReleaseTypeFromTail(text: string): {
  type?: ReleaseType;
  cleanedText: string;
} {
  const typeMatch = text.match(/\b(Album|EP|Demo)\b\s*$/i);
  if (!typeMatch) {
    return { type: undefined, cleanedText: text };
  }

  const matched = typeMatch[1] as ReleaseType;
  const cleanedText = normalizeText(text.slice(0, typeMatch.index));
  return { type: matched, cleanedText };
}

function splitArtistNames(artistSegment: string): string[] {
  return artistSegment
    .split(/[,/]+/) // comma or slash separators
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

export function parseReleaseMetadata(input: string): ParsedReleaseMetadata {
  let text = normalizeText(input);
  const result: ParsedReleaseMetadata = {};

  // 1) Catalog number at the beginning
  const catalogMatch = text.match(/^\s*\(([^)]+)\)\s*/);
  if (catalogMatch) {
    result.catalogNumber = catalogMatch[1].trim();
    text = normalizeText(text.slice(catalogMatch[0].length));
  }

  // 2) Parenthetical metadata tokens (type/year) first
  const parenthesisRegex = /\(([^)]+)\)/g;
  let match;
  while ((match = parenthesisRegex.exec(text)) !== null) {
    const content = normalizeText(match[1]);
    const typeFromParen = RELEASE_TYPES.find((type) =>
      new RegExp(`\\b${type}\\b`, 'i').test(content),
    );

    if (typeFromParen && !result.releaseType) {
      result.releaseType = typeFromParen;
    }

    const yearFromParen = content.match(/(19|20)\d{2}/);
    if (yearFromParen && !result.releaseYear) {
      result.releaseYear = Number(yearFromParen[0]);
    }

    if (typeFromParen || yearFromParen) {
      text = normalizeText(text.replace(match[0], ''));
      // Rewind regex to avoid skipping text after removal.
      parenthesisRegex.lastIndex = 0;
    }
  }

  // 3) Remove candidate release type from tail (if not already extracted)
  if (!result.releaseType) {
    const { type, cleanedText } = parseReleaseTypeFromTail(text);
    if (type) {
      result.releaseType = type;
      text = cleanedText;
    }
  }

  // 4) Handle year in dash-delimited form: Artist - 2016 - Title
  const dashSegments = text
    .split(/\s*-\s*/)
    .map(normalizeText)
    .filter(Boolean);
  if (dashSegments.length >= 3) {
    const yearIndex = dashSegments.findIndex((segment) =>
      /^(19|20)\d{2}$/.test(segment),
    );
    if (yearIndex !== -1) {
      if (!result.releaseYear) {
        result.releaseYear = Number(dashSegments[yearIndex]);
      }
      dashSegments.splice(yearIndex, 1);
      text = normalizeText(dashSegments.join(' - '));
    }
  }

  // 5) Year at end
  if (!result.releaseYear) {
    const { year, cleanedText } = parseYearIfStandalone(text);
    if (year) {
      result.releaseYear = year;
      text = cleanedText;
    }
  }

  // 6) Type at end (if still not found; maybe after year removal)
  if (!result.releaseType) {
    const { type, cleanedText } = parseReleaseTypeFromTail(text);
    if (type) {
      result.releaseType = type;
      text = cleanedText;
    }
  }

  // 7) Main artist/title extraction
  const segments = text
    .split(/\s*-\s*/)
    .map(normalizeText)
    .filter(Boolean);

  if (segments.length >= 2) {
    const [maybeArtist, ...remain] = segments;
    const candidateTitle = normalizeText(remain.join(' - '));

    if (!result.artistNames && maybeArtist) {
      result.artistNames = splitArtistNames(maybeArtist);
    }
    if (!result.releaseTitle && candidateTitle) {
      result.releaseTitle = candidateTitle;
    }
  } else {
    // For strings like `Artist "Title` or plain title-only
    const quoteParts = text
      .split(/["“”]+/)
      .map(normalizeText)
      .filter(Boolean);

    if (quoteParts.length >= 2) {
      const [maybeArtist, maybeTitle] = quoteParts;
      if (!result.artistNames && maybeArtist) {
        result.artistNames = splitArtistNames(maybeArtist);
      }
      if (!result.releaseTitle && maybeTitle) {
        result.releaseTitle = maybeTitle;
      }
    } else if (!result.releaseTitle && text) {
      result.releaseTitle = text;
    }
  }

  // sanitize empty arrays
  if (result.artistNames && result.artistNames.length === 0) {
    delete result.artistNames;
  }

  if (result.releaseTitle) {
    result.releaseTitle = normalizeText(result.releaseTitle);
  }

  return result;
}
