import type { CompressedData, Compressor, RawData } from '../compressor';
import {
  type CompressedMetadataData,
  MetadataCompressor,
  type RawMetadataData,
} from '../metadataCompressor';
import { UrlCompressor } from '../urlCompressor';

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

export class AlbumDataCompressor implements Compressor {
  private readonly metadataCompressor = new MetadataCompressor();

  compress(data: RawAlbumData): CompressedAlbumData {
    return {
      i: data.id,
      u: UrlCompressor.compress(data.url),
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
      url: UrlCompressor.expand(data.u),
      artist: data.a,
      title: data.t,
      artworkId: data.w,
      bandId: data.b,
      trackIds: data.r || [],
      metadata: data.m ? this.metadataCompressor.decompress(data.m) : undefined,
    };
  }
}
