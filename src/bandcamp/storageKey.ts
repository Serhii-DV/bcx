import type { Url } from './url';

export const BAND_KEY_PREFIX = 'b';
export const ALBUM_KEY_PREFIX = 'a';

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
}
