import type { RawMetadataData } from '../metadata';

export interface RawAlbumData {
  id: number;
  url: string;
  artist: string;
  title: string;
  artworkId: number;
  bandId: number;
  trackIds: number[];
  metadata?: RawMetadataData;
}
