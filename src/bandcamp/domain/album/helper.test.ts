import { describe, expect, it } from '@rstest/core';
import { getReleaseMetadataFromAlbum } from './helper';

describe('Album helper release metadata', () => {
  it('parses release metadata from the album title only', () => {
    const album = {
      artist: {
        toString: () => 'Different Artist',
        names: ['Different Artist'],
        isVariousArtists: false,
      },
      title: 'Primitive Outtakes - Schwarzmondnacht (EP 2023)',
      metadata: undefined,
    } as any;

    const parsed = getReleaseMetadataFromAlbum(album);

    expect(parsed.artistNames).toEqual(['Primitive Outtakes']);
    expect(parsed.releaseTitle).toBe('Schwarzmondnacht');
    expect(parsed.releaseType).toBe('EP');
    expect(parsed.releaseYear).toBe(2023);
  });

  it('returns album metadata year when parser cannot find year', () => {
    const album = {
      artist: {
        toString: () => 'Dark Ambient',
        names: ['Dark Ambient'],
        isVariousArtists: false,
      },
      title: 'Dark Ambient of 2023',
      metadata: {
        year: 2023,
      },
    } as any;

    const parsed = getReleaseMetadataFromAlbum(album);

    expect(parsed.releaseTitle).toBe('Dark Ambient of 2023');
    expect(parsed.releaseYear).toBe(2023);
  });
});
