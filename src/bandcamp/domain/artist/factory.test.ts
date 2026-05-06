import { describe, expect, it } from '@rstest/core';
import { ArtistFactory } from './factory';

describe('ArtistFactory', () => {
  it('normalizes input and caches equivalent artist instances', () => {
    const first = ArtistFactory.create('  Artist One  ');
    const second = ArtistFactory.create('Artist One');

    expect(first).toBe(second);
    expect(first.toString()).toBe('Artist One');
  });

  it('extracts artist from track titles when present', () => {
    const result = ArtistFactory.fromTrackTitle(
      'Track Artist - Song',
      'Album Artist',
    );

    expect(result.artist.toString()).toBe('Track Artist');
    expect(result.title).toBe('Song');
  });

  it('falls back to default artist when title has no artist prefix', () => {
    const result = ArtistFactory.fromTrackTitle('Song', 'Album Artist');

    expect(result.artist.toString()).toBe('Album Artist');
    expect(result.title).toBe('Song');
  });
});
