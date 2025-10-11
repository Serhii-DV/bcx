import { element } from 'src/utils/dom';

export interface Schema {
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
export function getSchema(): Schema {
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
