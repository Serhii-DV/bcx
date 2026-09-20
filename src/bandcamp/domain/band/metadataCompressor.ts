import type { CompressedData, RawData, RawDataCompressor } from '../compressor';
import type { BandMetadata } from './metadata';

export interface RawBandMetadata extends RawData {
  /** Compatibility with previously saved raw band data. */
  profile?: Pick<BandMetadata, 'location' | 'biography' | 'links'>;
  location?: string;
  biography?: string;
  links?: BandMetadata['links'];
  created: string;
  currency: string;
  albumIds: number[];
  trackIds: number[];
}

export interface CompressedBandMetadata extends CompressedData {
  p?: Pick<BandMetadata, 'location' | 'biography' | 'links'>;
  c: string; // created
  r: string; // currency
  a?: number[]; // albumIds
  t?: number[]; // trackIds
}

export class BandMetadataCompressor implements RawDataCompressor {
  compress(data: RawBandMetadata): CompressedBandMetadata {
    return {
      p: {
        location: data.location ?? data.profile?.location,
        biography: data.biography ?? data.profile?.biography,
        links: data.links ?? data.profile?.links ?? [],
      },
      c: data.created,
      r: data.currency,
      a: data.albumIds.length ? data.albumIds : undefined,
      t: data.trackIds.length ? data.trackIds : undefined,
    };
  }

  decompress(data: CompressedBandMetadata): RawBandMetadata {
    return {
      location: data.p?.location,
      biography: data.p?.biography,
      links: data.p?.links ?? [],
      created: data.c,
      currency: data.r,
      albumIds: data.a || [],
      trackIds: data.t || [],
    };
  }
}
