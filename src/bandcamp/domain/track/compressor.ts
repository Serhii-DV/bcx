import type { StorageObject } from 'src/core/storage';
import type { CompressedData, Compressor, RawData } from '../compressor';
import { UrlCompressor } from '../urlCompressor';

export interface RawTrackData extends RawData {
  id: number;
  url: string;
  artist: string;
  title: string;
  time: string;
  artworkId: number;
  albumId?: number;
  metadata?: StorageObject;
}

export interface CompressedTrackData extends CompressedData {
  i: number; // id
  u: string; // compressed url
  a: string; // artist
  t: string; // title
  d: string; // time
  w: number; // artworkId
  l?: number; // albumId
  m?: StorageObject; // metadata
}

export class TrackDataCompressor implements Compressor {
  compress(data: RawTrackData): CompressedTrackData {
    return {
      i: data.id,
      u: UrlCompressor.compress(data.url),
      a: data.artist,
      t: data.title,
      d: data.time,
      w: data.artworkId,
      l: data.albumId,
      m: data.metadata,
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
      metadata: data.m,
    };
  }
}
