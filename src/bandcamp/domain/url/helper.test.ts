import { describe, expect, it } from '@rstest/core';
import { Url } from 'src/core/url';
import {
  isBandcampAlbumUrl,
  isBandcampDiscoverUrl,
  isBandcampFanUrl,
  isBandcampFeedUrl,
  isBandcampMusicUrl,
  isBandcampRegularUrl,
  isBandcampTrackUrl,
  isBandcampUrl,
  isBandcampWishlistUrl,
} from './helper';

describe('Bandcamp URL helpers', () => {
  it('identifies Bandcamp URL families', () => {
    expect(isBandcampUrl(Url.create('https://artist.bandcamp.com/'))).toBe(
      true,
    );
    expect(isBandcampRegularUrl(Url.create('https://bandcamp.com/user'))).toBe(
      true,
    );
    expect(isBandcampMusicUrl(Url.create('https://artist.bandcamp.com/'))).toBe(
      true,
    );
    expect(
      isBandcampMusicUrl(Url.create('https://artist.bandcamp.com/music')),
    ).toBe(true);
    expect(
      isBandcampAlbumUrl(Url.create('https://artist.bandcamp.com/album/name')),
    ).toBe(true);
    expect(
      isBandcampTrackUrl(Url.create('https://artist.bandcamp.com/track/name')),
    ).toBe(true);
  });

  it('identifies regular Bandcamp page types', () => {
    expect(
      isBandcampFeedUrl(Url.create('https://bandcamp.com/user/feed')),
    ).toBe(true);
    expect(
      isBandcampDiscoverUrl(Url.create('https://bandcamp.com/discover')),
    ).toBe(true);
    expect(
      isBandcampFanUrl(Url.create('https://bandcamp.com/user'), 'user'),
    ).toBe(true);
    expect(
      isBandcampWishlistUrl(Url.create('https://bandcamp.com/user/wishlist')),
    ).toBe(true);
  });
});
