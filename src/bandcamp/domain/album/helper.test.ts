import { describe, expect, it } from '@rstest/core';
import { getReleaseMetadataFromAlbum } from './helper';

describe('Album helper release metadata', () => {
  it('parses artist/title into type/year/catalog info', () => {
    const album = {
      artist: {
        toString: () => 'Primitive Outtakes',
        names: ['Primitive Outtakes'],
        isVariousArtists: false,
      },
      title: 'Schwarzmondnacht (EP 2023)',
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
