import type { StorageObject } from 'src/core/storage';
import { Artist } from '../artist';
import type { MusicRecordingSchema } from '../page/schema';
import { Url } from '../url';
import { TrackTime } from './time';
import { Track } from './track';

export class TrackFactory {
  static fromRawData(
    id: string | number,
    url: string | Url | URL,
    artist: string | Artist,
    title: string,
    time: string | TrackTime,
  ): Track {
    const trackId =
      typeof id === 'string' ? parseInt(id.replace('track-', ''), 10) : id;
    const trackUrl = Url.create(url);
    const trackTime =
      typeof time === 'string' ? TrackTime.fromString(time) : time;

    const trackArtist =
      typeof artist === 'string' ? Artist.fromString(artist) : artist;

    return new Track(trackId, trackUrl, trackArtist, title, trackTime);
  }

  static fromSchema(schema: MusicRecordingSchema): Track {
    const trackId =
      (schema.additionalProperty?.find((prop) => prop.name === 'track_id')
        ?.value as number) || 0;

    const url = schema.mainEntityOfPage;
    const artist = schema.byArtist.name;
    const title = schema.name;
    const time = TrackTime.fromDuration(schema.duration);

    return TrackFactory.fromRawData(trackId, url, artist, title, time);
  }

  static fromStorage(track: StorageObject): Track {
    return TrackFactory.fromRawData(
      track.id,
      track.url,
      track.artist,
      track.title,
      track.time,
    );
  }
}
