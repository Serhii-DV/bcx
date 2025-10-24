import type { CompressedData, RawData, RawDataCompressor } from '../compressor';
import {
  type CompressedMetadataData,
  MetadataCompressor,
  type RawMetadataData,
} from '../metadataCompressor';
import type { UrlCompressor } from '../url/compressor';

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

export class TrackDataCompressor implements RawDataCompressor {
  constructor(
    private urlCompressor: UrlCompressor,
    private metadataCompressor: MetadataCompressor,
  ) {}
  compress(data: RawTrackData): CompressedTrackData {
    return {
      i: data.id,
      u: this.urlCompressor.compress(data.url),
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
      url: this.urlCompressor.decompress(data.u),
      artist: data.a,
      title: data.t,
      time: data.d,
      artworkId: data.w,
      albumId: data.l,
      metadata: data.m ? this.metadataCompressor.decompress(data.m) : undefined,
    };
  }
}
