import { element } from 'src/utils/dom';

// MusicAlbum Schema (Album)
export interface MusicAlbumSchema {
  '@type': string;
  '@id': string;
  albumReleaseType: string;
  mainEntityOfPage: string;
  name: string;
  dateModified: string;
  datePublished: string;
  numTracks: number;
  albumRelease: AlbumRelease[];
  byArtist: {
    '@type': string;
    name: string;
  };
  publisher: {
    '@type': string;
    '@id': string;
    name: string;
    additionalProperty: PropertyValue[];
    image: string;
    genre: string;
    description: string;
    mainEntityOfPage: WebPage[];
    subjectOf: WebPage[];
    foundingLocation: {
      '@type': string;
      name: string;
    };
  };
  track: {
    '@type': string;
    numberOfItems: number;
    itemListElement: {
      '@type': string;
      position: number;
      item: {
        '@type': string;
        '@id': string;
        additionalProperty: PropertyValue[];
        name: string;
        duration: string;
        copyrightNotice: string;
        mainEntityOfPage: string;
      };
    }[];
  };
  image: string;
  keywords: string[];
  description: string;
  creditText: string;
  copyrightNotice: string;
  comment?: Comment[];
  sponsor?: Person[];
  additionalProperty: PropertyValue[];
  '@context': string;
}

// MusicRecording Schema (Track)
export interface MusicRecordingSchema {
  '@type': string;
  '@id': string;
  additionalProperty?: PropertyValue[];
  name: string;
  description?: string;
  duration: string;
  dateModified: string;
  datePublished: string;
  inAlbum?: {
    '@type': string;
    name: string;
    albumRelease: AlbumRelease[];
    albumReleaseType: string;
    '@id'?: string;
    byArtist?: {
      '@type': string;
      name: string;
    };
    additionalProperty?: PropertyValue[];
    numTracks?: number;
  };
  byArtist: {
    '@type': string;
    name: string;
    '@id'?: string;
    additionalProperty?: PropertyValue[];
  };
  publisher: {
    '@type': string;
    '@id': string;
    name: string;
    additionalProperty: PropertyValue[];
    image: string;
    mainEntityOfPage: WebPage[];
    subjectOf: WebPage[];
    foundingLocation: {
      '@type': string;
      name: string;
    };
  };
  copyrightNotice: string;
  keywords: string[];
  image: string;
  sponsor?: Person[];
  mainEntityOfPage: string;
  '@context': string;
}

// Union type for both schemas
export type Schema = MusicAlbumSchema | MusicRecordingSchema;

export interface AlbumRelease {
  '@type': string[] | string;
  '@id': string;
  name: string;
  additionalProperty: PropertyValue[];
  description?: string;
  offers: Offer;
  musicReleaseFormat: string;
  image: string[];
}

export interface PropertyValue {
  '@type': string;
  name: string;
  value: string | number | boolean | number[];
}

export interface Offer {
  '@type': string;
  url: string;
  priceCurrency: string;
  price: number;
  priceSpecification: {
    minPrice: number;
  };
  availability: string;
  additionalProperty?: PropertyValue[];
}

export interface WebPage {
  '@type': string;
  url: string;
  name: string;
  additionalProperty?: PropertyValue[];
}

export interface Comment {
  '@type': string;
  author: Person;
  text: string[];
}

export interface Person {
  '@type': string;
  url: string;
  image?: string;
  additionalProperty?: PropertyValue[];
  name?: string;
}

/**
 * Finds and parses the LD+JSON schema from the page
 * @return Parsed Schema object or null if not found/failed
 */
function getSchema(): Schema {
  const schemaScript = element('script[type="application/ld+json"]');

  if (!schemaScript) {
    throw new Error('No LD+JSON schema script tag found on page');
  }

  try {
    return JSON.parse(schemaScript.textContent || '') as Schema;
  } catch (error) {
    throw new Error('Failed to parse LD+JSON schema', { cause: error });
  }
}

/**
 * Type guard to check if schema is an AlbumSchema
 */
function isMusicAlbumSchema(schema: Schema): schema is MusicAlbumSchema {
  return schema['@type'] === 'MusicAlbum' || 'track' in schema;
}

/**
 * Type guard to check if schema is a TrackSchema
 */
function isMusicRecordingSchema(
  schema: Schema,
): schema is MusicRecordingSchema {
  return schema['@type'] === 'MusicRecording' || 'inAlbum' in schema;
}

/**
 * Gets schema and ensures it's an AlbumSchema
 */
export function getMusicAlbumSchema(): MusicAlbumSchema {
  const schema = getSchema();
  if (!isMusicAlbumSchema(schema)) {
    throw new Error('Expected AlbumSchema');
  }
  return schema;
}

/**
 * Gets schema and ensures it's a TrackSchema
 */
export function getMusicRecordingSchema(): MusicRecordingSchema {
  const schema = getSchema();
  if (!isMusicRecordingSchema(schema)) {
    throw new Error('Expected TrackSchema');
  }
  return schema;
}
