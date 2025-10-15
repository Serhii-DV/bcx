import { console } from 'src/utils/console';
import {
  getMusicRecordingSchema,
  type MusicRecordingSchema,
} from '../../page/schema';
import { TrackFactory } from './factory';
import { Track } from './track';

export class TrackPage {
  public track: Track;
  public isStandaloneTrack: boolean;

  constructor() {
    const schema = getMusicRecordingSchema();
    console.log('[TrackPage]', 'Schema:', schema);
    this.track = TrackFactory.fromSchema(schema!);
    console.log('[TrackPage]', 'Track extracted from schema:', this.track);
    this.isStandaloneTrack = this.detectIfStandaloneTrack(schema!);
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
