import type { Url } from './url';

// We use `/` at the start to avoid potential collisions with other keys and namespaces
// Also, it shows up nicely in the storage viewer before UUID values
const BAND_KEY_PREFIX = '/b/';
const ALBUM_KEY_PREFIX = '/a/';
const BANDS_KEY = '/bands';

export class StorageKey {
  static bandKey(bandId: number): string {
    return `${BAND_KEY_PREFIX}${bandId}`;
  }

  static albumKey(albumId: number): string {
    return `${ALBUM_KEY_PREFIX}${albumId}`;
  }

  static urlKey(url: Url): string {
    return url.uuid;
  }

  static isBandKey(key: string): boolean {
    return key.startsWith(BAND_KEY_PREFIX);
  }

  static isAlbumKey(key: string): boolean {
    return key.startsWith(ALBUM_KEY_PREFIX);
  }

  static bandsKey(): string {
    return BANDS_KEY;
  }

  static isBandsKey(key: string): boolean {
    return key === BANDS_KEY;
  }
}
