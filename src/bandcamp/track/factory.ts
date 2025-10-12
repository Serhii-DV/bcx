import type { StorageObject } from 'src/core/storage';
import type { MusicRecordingSchema } from '../page/schema';
import { Url } from '../url';
import { TrackTime } from './time';
import { Track } from './track';

export class TrackFactory {
  static create(id: number, url: Url, title: string, time: TrackTime): Track {
    return new Track(id, url, title, time);
  }

  static fromRawData(
    id: string | number,
    url: string | Url | URL,
    title: string,
    time: string | TrackTime,
  ): Track {
    const trackId =
      typeof id === 'string' ? parseInt(id.replace('track-', ''), 10) : id;
    const trackUrl = Url.create(url);
    const trackTime =
      typeof time === 'string' ? TrackTime.fromString(time) : time;

    return new Track(trackId, trackUrl, title, trackTime);
  }

  static fromSchema(schema: MusicRecordingSchema): Track {
    const trackId =
      (schema.additionalProperty?.find((prop) => prop.name === 'track_id')
        ?.value as number) || 0;

    const url = new Url(schema.mainEntityOfPage);
    const title = schema.name;
    const time = TrackTime.fromDuration(schema.duration);

    return new Track(trackId, url, title, time);
  }

  static fromStorage(track: StorageObject): Track {
    return TrackFactory.fromRawData(
      track.id,
      track.url,
      track.title,
      track.time,
    );
  }
}
