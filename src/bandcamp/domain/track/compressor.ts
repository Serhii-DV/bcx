import type { CompressedData, Compressor, RawData } from '../compressor';
import {
  type CompressedMetadataData,
  MetadataCompressor,
  type RawMetadataData,
} from '../metadataCompressor';
import { UrlCompressor } from '../url/urlCompressor';

export interface RawTrackData extends RawData {
  id: number;
  url: string;
  artist: string;
  title: string;
  time: string;
  artworkId: number;
  albumId?: number;
  metadata?: RawMetadataData;
}

export interface CompressedTrackData extends CompressedData {
  i: number; // id
  u: string; // compressed url
  a: string; // artist
  t: string; // title
  d: string; // time
  w: number; // artworkId
  l?: number; // albumId
  m?: CompressedMetadataData; // metadata
}

export class TrackDataCompressor implements Compressor {
  private readonly metadataCompressor = new MetadataCompressor();

  compress(data: RawTrackData): CompressedTrackData {
    return {
      i: data.id,
      u: UrlCompressor.compress(data.url),
      a: data.artist,
      t: data.title,
      d: data.time,
      w: data.artworkId,
      l: data.albumId,
      m: data.metadata
        ? this.metadataCompressor.compress(data.metadata)
        : undefined,
    };
  }

  decompress(data: CompressedTrackData): RawTrackData {
    return {
      id: data.i,
      url: UrlCompressor.expand(data.u),
      artist: data.a,
      title: data.t,
      time: data.d,
      artworkId: data.w,
      albumId: data.l,
      metadata: data.m ? this.metadataCompressor.decompress(data.m) : undefined,
    };
  }
}
