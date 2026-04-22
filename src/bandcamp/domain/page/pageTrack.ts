import { console } from 'src/utils/console';
import type { Album } from '../album/album';
import type { AlbumDetails } from '../album/details';
import type { Band } from '../band/band';
import { TrackFactory } from '../track/factory';
import { Track } from '../track/track';
import type { BandPage } from './BandPage';
import { getMusicRecordingSchema, type MusicRecordingSchema } from './schema';

export class PageTrack implements BandPage {
  public readonly band: Band | null = null;
  public readonly album: Album | null = null;
  public readonly albumDetails: AlbumDetails | null = null;
  public track: Track;
  public isStandaloneTrack: boolean;

  constructor() {
    const schema = getMusicRecordingSchema();
    console.log('[PageTrack]', 'Schema:', schema);

    this.track = TrackFactory.fromSchema(schema);
    this.isStandaloneTrack = this.detectIfStandaloneTrack(schema);

    console.log('[PageTrack]', 'Extracted track:', this.track);
  }

  private detectIfStandaloneTrack(schema: MusicRecordingSchema): boolean {
    // Check if it's a single-track album (effectively a standalone track)
    if (schema.inAlbum?.numTracks === 1) {
      return true;
    }

    // Check if track has no track number (indicates standalone)
    const hasTrackNum = schema.additionalProperty?.some(
      (prop) => prop.name === 'tracknum',
    );

    return !hasTrackNum;
  }

  public getTrackType(): 'standalone' | 'album-track' {
    return this.isStandaloneTrack ? 'standalone' : 'album-track';
  }
}
