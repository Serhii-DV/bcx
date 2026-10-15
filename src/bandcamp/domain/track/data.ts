import type { RawMetadataData } from '../metadata';

export interface RawTrackData {
  id: number;
  position: number;
  artist: string;
  title: string;
  artworkId: number;
  url?: string;
  time?: string;
  albumId?: number;
  metadata?: RawMetadataData;
}
