import { describe, expect, it } from '@rstest/core';
import { Url } from 'src/core/url';
import { BandcampUrlFactory } from './factory';

describe('BandcampUrlFactory', () => {
  it('normalizes band, album and track URLs', () => {
    expect(
      BandcampUrlFactory.create(
        Url.create('https://artist.bandcamp.com/music?from=menu#hash'),
      ).toString(),
    ).toBe('https://artist.bandcamp.com/');
    expect(
      BandcampUrlFactory.create(
        Url.create('https://artist.bandcamp.com/album/release?x=1#about'),
      ).toString(),
    ).toBe('https://artist.bandcamp.com/album/release');
    expect(
      BandcampUrlFactory.create(
        Url.create('https://artist.bandcamp.com/track/song?x=1#about'),
      ).toString(),
    ).toBe('https://artist.bandcamp.com/track/song');
  });

  it('generates common Bandcamp URLs', () => {
    expect(BandcampUrlFactory.generateBandUrlFromSubdomain('artist')).toBe(
      'https://artist.bandcamp.com/',
    );
    expect(BandcampUrlFactory.generateFanUrl('fan')).toBe(
      'https://bandcamp.com/fan',
    );
    expect(BandcampUrlFactory.generateWishlistUrl('fan')).toBe(
      'https://bandcamp.com/fan/wishlist',
    );
    expect(BandcampUrlFactory.generateFollowingBandsUrl('fan')).toBe(
      'https://bandcamp.com/fan/following/artists_and_labels',
    );
  });
});
