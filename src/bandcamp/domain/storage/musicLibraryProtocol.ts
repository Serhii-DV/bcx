import type { RawAlbumData } from '../album/data';
import type { RawBandData } from '../band/data';
import type { RawMetadataData } from '../metadata';
import type { RawTrackData } from '../track/data';

export const MUSIC_LIBRARY_REVISION_KEY = '/music-library/revision';
export type MusicStore = 'bands' | 'albums' | 'tracks';
export interface MusicBatch {
  bands?: RawBandData[];
  albums?: RawAlbumData[];
  tracks?: RawTrackData[];
}
export interface MusicLibraryData {
  bands: RawBandData[];
  albums: RawAlbumData[];
  tracks: RawTrackData[];
  revision: string;
}
export type MusicLibraryRequest =
  | { action: 'read'; store: MusicStore; ids?: number[] }
  | { action: 'lookup'; uuids: string[] }
  | { action: 'save'; data: MusicBatch }
  | { action: 'find-albums'; artists: string[] }
  | { action: 'match-albums'; title: string; artist: string }
  | { action: 'find-bands'; names: string[] }
  | { action: 'remove-tracks'; ids: number[] }
  | { action: 'revision' };

export const normalizeMusicName = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLowerCase();

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function isId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
function isIds(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isId);
}
function isStrings(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}
function isUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}
function isMetadata(value: unknown): value is RawMetadataData {
  return (
    isRecord(value) &&
    isRecord(value.price) &&
    typeof value.price.amount === 'number' &&
    Number.isFinite(value.price.amount) &&
    typeof value.price.currency === 'string' &&
    typeof value.publisher === 'string' &&
    typeof value.published === 'string' &&
    typeof value.modified === 'string' &&
    isStrings(value.keywords) &&
    (value.release === undefined ||
      (isRecord(value.release) &&
        [
          'description',
          'credits',
          'artistUrl',
          'publisherUrl',
          'releaseType',
        ].every((key) =>
          optionalString(
            value.release && isRecord(value.release)
              ? value.release[key]
              : undefined,
          ),
        ) &&
        (value.release.priceAvailable === undefined ||
          typeof value.release.priceAvailable === 'boolean') &&
        (value.release.minimumPrice === undefined ||
          (typeof value.release.minimumPrice === 'number' &&
            Number.isFinite(value.release.minimumPrice)))))
  );
}
export function isRawBand(value: unknown): value is RawBandData {
  if (!isRecord(value) || !isRecord(value.metadata)) return false;
  const metadata = value.metadata;
  return (
    isId(value.id) &&
    typeof value.name === 'string' &&
    isUrl(value.url) &&
    isId(value.artworkId) &&
    typeof metadata.created === 'string' &&
    typeof metadata.currency === 'string' &&
    isIds(metadata.albumIds) &&
    isIds(metadata.trackIds) &&
    optionalString(metadata.location) &&
    optionalString(metadata.biography) &&
    (metadata.links === undefined ||
      (Array.isArray(metadata.links) &&
        metadata.links.every(
          (link) =>
            isRecord(link) &&
            typeof link.label === 'string' &&
            typeof link.url === 'string',
        )))
  );
}
export function isRawAlbum(value: unknown): value is RawAlbumData {
  return (
    isRecord(value) &&
    isId(value.id) &&
    isUrl(value.url) &&
    typeof value.artist === 'string' &&
    typeof value.title === 'string' &&
    isId(value.artworkId) &&
    isId(value.bandId) &&
    isIds(value.trackIds) &&
    (value.metadata === undefined || isMetadata(value.metadata))
  );
}
export function isRawTrack(value: unknown): value is RawTrackData {
  return (
    isRecord(value) &&
    isId(value.id) &&
    isId(value.position) &&
    typeof value.artist === 'string' &&
    typeof value.title === 'string' &&
    isId(value.artworkId) &&
    (value.url === undefined || isUrl(value.url)) &&
    optionalString(value.time) &&
    (value.albumId === undefined || isId(value.albumId)) &&
    (value.metadata === undefined || isMetadata(value.metadata))
  );
}
export function isMusicLibraryData(value: unknown): value is MusicLibraryData {
  return (
    isRecord(value) &&
    typeof value.revision === 'string' &&
    Array.isArray(value.bands) &&
    value.bands.every(isRawBand) &&
    Array.isArray(value.albums) &&
    value.albums.every(isRawAlbum) &&
    Array.isArray(value.tracks) &&
    value.tracks.every(isRawTrack)
  );
}
export function isMusicLibraryRequest(
  value: unknown,
): value is MusicLibraryRequest {
  if (!isRecord(value)) return false;
  switch (value.action) {
    case 'read':
      return (
        ['bands', 'albums', 'tracks'].includes(String(value.store)) &&
        (value.ids === undefined || isIds(value.ids))
      );
    case 'lookup':
      return isStrings(value.uuids);
    case 'find-albums':
      return isStrings(value.artists);
    case 'match-albums':
      return (
        typeof value.title === 'string' && typeof value.artist === 'string'
      );
    case 'find-bands':
      return isStrings(value.names);
    case 'remove-tracks':
      return isIds(value.ids);
    case 'revision':
      return true;
    case 'save':
      return (
        isRecord(value.data) &&
        (value.data.bands === undefined ||
          (Array.isArray(value.data.bands) &&
            value.data.bands.every(isRawBand))) &&
        (value.data.albums === undefined ||
          (Array.isArray(value.data.albums) &&
            value.data.albums.every(isRawAlbum))) &&
        (value.data.tracks === undefined ||
          (Array.isArray(value.data.tracks) &&
            value.data.tracks.every(isRawTrack)))
      );
    default:
      return false;
  }
}
