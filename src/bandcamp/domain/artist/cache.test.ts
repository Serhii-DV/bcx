import { describe, expect, it } from '@rstest/core';
import { ArtistMemoryCache } from './cache';
import { ArtistFactory } from './factory';

describe('ArtistMemoryCache', () => {
  it('stores, retrieves, counts, and clears artists', () => {
    const cache = new ArtistMemoryCache();
    const artist = ArtistFactory.create('Artist');

    expect(cache.get('artist')).toBeUndefined();
    expect(cache.set('artist', artist)).toBe(artist);
    expect(cache.get('artist')).toBe(artist);
    expect(cache.size()).toBe(1);

    cache.clear();
    expect(cache.size()).toBe(0);
  });
});
