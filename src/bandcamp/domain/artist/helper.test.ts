import { describe, expect, it } from '@rstest/core';
import { containsArtistName } from './helper';

describe('containsArtistName', () => {
  it('matches artist names case-insensitively', () => {
    expect(containsArtistName(['Artist One'], 'artist one')).toBe(true);
    expect(containsArtistName(['Artist One'], 'Artist Two')).toBe(false);
  });
});
