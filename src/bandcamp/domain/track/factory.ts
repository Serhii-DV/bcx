import type { StorageObject } from 'src/core/storage';
import { Artist } from '../artist';
import { Artwork } from '../artwork';
import { decompress } from '../compressor';
import { Metadata } from '../metadata';
import type {
  MusicAlbumSchema,
  MusicRecordingSchema,
  PropertyValue,
} from '../page/schema';
import { Price } from '../price';
import { bandcampPageData } from '../shared';
import { Url } from '../url';
import {
  type CompressedTrackData,
  type RawTrackData,
  TrackDataCompressor,
} from './compressor';
import { TrackTime } from './time';
import { Track } from './track';

export class TrackFactory {
  static create(
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
    const trackUrl = Url.parse(url);
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
    const mainArtist = schema.inAlbum?.byArtist?.name || schema.byArtist.name;
    const { artist, title } = Artist.fromTrackTitle(schema.name, mainArtist);
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

    return TrackFactory.create(
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

  /**
   * Extract track information from schema
   */
  static createTracksFromSchema(schema: MusicAlbumSchema): Track[] {
    const tracks: Track[] = [];
    const albumArtId = schema.albumRelease[0]?.additionalProperty.find(
      (prop: PropertyValue) => prop.name === 'art_id',
    )?.value as number;
    const albumId = schema.albumRelease[0]?.additionalProperty.find(
      (prop: PropertyValue) => prop.name === 'item_id',
    )?.value as number;

    schema.track.itemListElement.forEach((trackItem) => {
      const trackId = trackItem.item.additionalProperty.find(
        (prop: PropertyValue) => prop.name === 'track_id',
      )?.value as number;
      const url = trackItem.item.mainEntityOfPage;
      const { artist, title } = Artist.fromTrackTitle(
        trackItem.item.name,
        trackItem.item.byArtist
          ? trackItem.item.byArtist.name
          : schema.byArtist.name,
      );
      const time = TrackTime.fromDuration(trackItem.item.duration);
      const artId = albumArtId;

      const track = TrackFactory.create(
        trackId,
        url,
        artist,
        title,
        time,
        artId,
        albumId,
        undefined,
      );

      tracks.push(track);
    });

    return tracks;
  }

  static fromRawData(rawData: RawTrackData): Track {
    return TrackFactory.create(
      rawData.id,
      rawData.url,
      rawData.artist,
      rawData.title,
      rawData.time,
      rawData.artworkId,
      rawData.albumId,
      rawData.metadata ? Metadata.fromRawData(rawData.metadata) : undefined,
    );
  }

  static fromCompressedData(data: CompressedTrackData): Track {
    const rawData = decompress(
      data as CompressedTrackData,
      new TrackDataCompressor(),
    ) as RawTrackData;

    return this.fromRawData(rawData);
  }

  static fromStorage(track: StorageObject): Track {
    return this.fromCompressedData(track as CompressedTrackData);
  }
}
