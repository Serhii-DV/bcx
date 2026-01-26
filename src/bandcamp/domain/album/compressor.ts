import type { CompressedData, RawData, RawDataCompressor } from '../compressor';
import {
  type CompressedMetadataData,
  MetadataCompressor,
  type RawMetadataData,
} from '../metadataCompressor';
import type { UrlCompressor } from '../url/compressor';

export interface RawAlbumData extends RawData {
  id: number;
  url: string;
  artist: string;
  title: string;
  artworkId: number;
  bandId: number;
  trackIds: number[];
  metadata?: RawMetadataData;
}

export interface CompressedAlbumData extends CompressedData {
  i: number; // id
  u: string; // compressed url
  a: string; // artist
  t: string; // title
  w: number; // artworkId
  b: number; // bandId
  r?: number[]; // trackIds
  m?: CompressedMetadataData; // metadata
}

export class AlbumDataCompressor implements RawDataCompressor {
  constructor(
    private urlCompressor: UrlCompressor,
    private metadataCompressor: MetadataCompressor,
  ) {}

  compress(data: RawAlbumData): CompressedAlbumData {
    return {
      i: data.id,
      u: this.urlCompressor.compress(data.url),
      a: data.artist,
      t: data.title,
      w: data.artworkId,
      b: data.bandId,
      r: data.trackIds.length ? data.trackIds : undefined,
      m: data.metadata
        ? this.metadataCompressor.compress(data.metadata)
        : undefined,
    };
  }

  decompress(data: CompressedAlbumData): RawAlbumData {
    return {
      id: data.i,
      url: this.urlCompressor.decompress(data.u),
      artist: data.a,
      title: data.t,
      artworkId: data.w,
      bandId: data.b,
      trackIds: data.r || [],
      metadata: data.m ? this.metadataCompressor.decompress(data.m) : undefined,
    };
  }
}
