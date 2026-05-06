import { describe, expect, it } from '@rstest/core';
import { UrlCompressor } from './compressor';

describe('UrlCompressor', () => {
  const compressor = new UrlCompressor();

  it('compresses Bandcamp album and track URLs', () => {
    expect(
      compressor.compress('https://artist.bandcamp.com/album/release'),
    ).toBe('artist/a/release');
    expect(compressor.compress('https://artist.bandcamp.com/track/song')).toBe(
      'artist/t/song',
    );
  });

  it('decompresses to normalized Bandcamp URLs', () => {
    expect(compressor.decompress('artist/a/release')).toBe(
      'https://artist.bandcamp.com/album/release',
    );
    expect(compressor.decompress('artist/t/song')).toBe(
      'https://artist.bandcamp.com/track/song',
    );
    expect(compressor.decompress('artist')).toBe(
      'https://artist.bandcamp.com/',
    );
  });
});
