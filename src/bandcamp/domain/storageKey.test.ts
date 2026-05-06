import { describe, expect, it } from '@rstest/core';
import {
  ALBUM_KEY_PREFIX,
  BAND_KEY_PREFIX,
  BANDS_KEY,
  StorageKey,
  TRACK_KEY_PREFIX,
} from './storageKey';

describe('StorageKey', () => {
  it('creates storage keys with expected prefixes', () => {
    expect(StorageKey.bandKey(1)).toBe(`${BAND_KEY_PREFIX}1`);
    expect(StorageKey.albumKey(2)).toBe(`${ALBUM_KEY_PREFIX}2`);
    expect(StorageKey.trackKey(3)).toBe(`${TRACK_KEY_PREFIX}3`);
    expect(StorageKey.trackKeys([3, 4])).toEqual(['/t/3', '/t/4']);
    expect(StorageKey.bandsKey()).toBe(BANDS_KEY);
  });

  it('detects key types', () => {
    expect(StorageKey.isBandKey('/b/1')).toBe(true);
    expect(StorageKey.isAlbumKey('/a/1')).toBe(true);
    expect(StorageKey.isTrackKey('/t/1')).toBe(true);
    expect(StorageKey.isBandsKey('/bands')).toBe(true);
    expect(StorageKey.isBandKey('/a/1')).toBe(false);
  });
});
