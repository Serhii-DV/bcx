import { describe, expect, it } from '@rstest/core';
import { ArtistFactory } from '../artist/factory';
import {
  getArtistNamesFromTracks,
  getUniqueArtistNamesFromTracks,
} from './helper';

describe('track helpers', () => {
  it('collects artist names from tracks and can return unique sorted names', () => {
    const tracks = [
      { artist: ArtistFactory.create('Beta / Alpha') },
      { artist: ArtistFactory.create('Alpha') },
    ] as any;

    expect(getArtistNamesFromTracks(tracks)).toEqual([
      'Beta',
      'Alpha',
      'Alpha',
    ]);
    expect(getUniqueArtistNamesFromTracks(tracks)).toEqual(['Alpha', 'Beta']);
  });
});
