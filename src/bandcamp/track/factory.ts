import type { MusicRecordingSchema } from '../page/schema';
import { Url } from '../url';
import { TrackTime } from './time';
import { Track } from './track';

export class TrackFactory {
  static create(
    id: string | number,
    url: string | Url | URL,
    title: string,
    time: string | TrackTime,
  ): Track {
    return new Track(
      typeof id === 'string' ? parseInt(id.replace('track-', '')) : id,
      Url.create(url),
      title,
      TrackTime.fromString(time.toString()),
    );
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
}
