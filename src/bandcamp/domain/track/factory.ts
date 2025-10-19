import type { StorageObject } from 'src/core/storage';
import { Artist } from '../artist';
import { Artwork } from '../artwork';
import { Metadata } from '../metadata';
import type { MusicRecordingSchema } from '../page/schema';
import { Price } from '../price';
import { bandcampPageData } from '../shared';
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
    artwork: string | number | Artwork,
    albumId?: number,
    metadata?: Metadata,
  ): Track {
    const trackId =
      typeof id === 'string' ? parseInt(id.replace('track-', ''), 10) : id;
    const trackUrl = Url.create(url);
    const trackTime =
      typeof time === 'string' ? TrackTime.fromString(time) : time;

    const trackArtist =
      typeof artist === 'string' ? Artist.fromString(artist) : artist;

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
      albumId,
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
    // albumId is not available in schema, try to get it from pagedata
    const albumId = bandcampPageData.albumId || undefined;
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

    const metadata = Metadata.create(
      price,
      schema.publisher.name,
      schema.datePublished,
      schema.dateModified,
      schema.keywords,
    );

    return TrackFactory.fromRawData(
      trackId,
      url,
      artist,
      title,
      time,
      artId,
      albumId,
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
      track.albumId,
      track.metadata ? Metadata.fromStorageObject(track.metadata) : undefined,
    );
  }
}
