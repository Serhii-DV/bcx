import type { CompressedData, RawData, RawDataCompressor } from '../compressor';
import {
  type CompressedMetadataData,
  MetadataCompressor,
  type RawMetadataData,
} from '../metadataCompressor';
import type { UrlCompressor } from '../url/compressor';

export interface RawTrackData extends RawData {
  id: number;
  artist: string;
  title: string;
  artworkId: number;
  url?: string;
  time?: string;
  albumId?: number;
  metadata?: RawMetadataData;
}

export interface CompressedTrackData extends CompressedData {
  i: number; // id
  a: string; // artist
  t: string; // title
  w: number; // artworkId
  u?: string; // compressed url
  d?: string; // time
  l?: number; // albumId
  m?: CompressedMetadataData; // metadata
}

export class TrackDataCompressor implements RawDataCompressor {
  constructor(
    private urlCompressor: UrlCompressor,
    private metadataCompressor: MetadataCompressor,
  ) {}
  compress(data: RawTrackData): CompressedTrackData {
    return {
      i: data.id,
      a: data.artist,
      t: data.title,
      w: data.artworkId,
      u: data.url ? this.urlCompressor.compress(data.url) : undefined,
      d: data.time,
      l: data.albumId,
      m: data.metadata
        ? this.metadataCompressor.compress(data.metadata)
        : undefined,
    };
  }

  decompress(data: CompressedTrackData): RawTrackData {
    return {
      id: data.i,
      artist: data.a,
      title: data.t,
      artworkId: data.w,
      url: data.u ? this.urlCompressor.decompress(data.u) : undefined,
      time: data.d,
      albumId: data.l,
      metadata: data.m ? this.metadataCompressor.decompress(data.m) : undefined,
    };
  }
}
