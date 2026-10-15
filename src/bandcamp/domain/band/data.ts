import type { RawBandMetadata } from './metadata';

export interface RawBandData {
  id: number;
  name: string;
  url: string;
  artworkId: number;
  metadata: RawBandMetadata;
}
