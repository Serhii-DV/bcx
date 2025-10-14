import type { StorageObject } from 'src/core/storage';
import { Artist } from '../core/artist';
import { Artwork } from '../core/artwork';
import { Price } from '../core/price';
import { Url } from '../core/url';
import type { MusicRecordingSchema } from '../page/schema';
import { TrackMetadata } from './metadata';
import { TrackTime } from './time';
import { Track } from './track';

export class TrackFactory {
  static fromRawData(
    id: string | number,
    url: string | Url | URL,
    artist: string | Artist,
    title: string,
    time: string | TrackTime,
    artwork: string | number | Artwork,
    metadata?: TrackMetadata,
  ): Track {
    const trackId =
      typeof id === 'string' ? parseInt(id.replace('track-', ''), 10) : id;
    const trackUrl = Url.create(url);
    const trackTime =
      typeof time === 'string' ? TrackTime.fromString(time) : time;

    const trackArtist =
      typeof artist === 'string' ? Artist.fromString(artist) : artist;

    const trackAlbumId = 0;

    const trackArtwork =
      artwork instanceof Artwork
        ? artwork
        : new Artwork(
            typeof artwork === 'string' ? parseInt(artwork) : artwork,
          );

    return new Track(
      trackId,
      trackUrl,
      trackArtist,
      title,
      trackTime,
      trackArtwork,
      trackAlbumId,
      metadata,
    );
  }

  static fromSchema(schema: MusicRecordingSchema): Track {
    const trackId =
      (schema.additionalProperty?.find((prop) => prop.name === 'track_id')
        ?.value as number) || 0;

    const url = schema.mainEntityOfPage;
    const artist = schema.inAlbum?.byArtist?.name || schema.byArtist.name;
    const title = schema.name;
    const time = TrackTime.fromDuration(schema.duration);
    const artId =
      (schema.additionalProperty?.find((prop) => prop.name === 'art_id')
        ?.value as number) || 0;

    const digitalRelease = schema?.inAlbum?.albumRelease?.filter(
      (release) => release.musicReleaseFormat === 'Digital',
    )[0];
    const price = Price.create(
      (digitalRelease?.offers.price as number) || 0,
      digitalRelease?.offers.priceCurrency || 'USD',
    );

    const metadata = new TrackMetadata(
      price,
      new Date(schema.datePublished),
      new Date(schema.dateModified),
    );

    return TrackFactory.fromRawData(
      trackId,
      url,
      artist,
      title,
      time,
      artId,
      metadata,
    );
  }

  static fromStorage(track: StorageObject): Track {
    return TrackFactory.fromRawData(
      track.id,
      track.url,
      track.artist,
      track.title,
      track.time,
      track.artId,
    );
  }
}
