import { describe, expect, it } from '@rstest/core';
import { Artist } from './artist';

describe('ReleaseArtist', () => {
  describe('constructor', () => {
    it('should correctly initialize names and joins', () => {
      const artist = new Artist(['Artist1', 'Artist2'], ['&']);
      expect(artist.names).toEqual(['Artist1', 'Artist2']);
      expect(artist.joins).toEqual(['&']);
    });

    it('should trim join strings', () => {
      const artist = new Artist(['Artist A', 'Artist B'], [' | ']);
      expect(artist.joins).toEqual(['|']);
    });

    it('should handle empty joins array', () => {
      const artist = new Artist(['Solo Artist']);
      expect(artist.names).toEqual(['Solo Artist']);
      expect(artist.joins).toEqual([]);
    });
  });

  describe('asString', () => {
    it('should return the correct artist string', () => {
      const artist = new Artist(['Band One', 'Band Two'], [' & ']);
      expect(artist.value).toBe('Band One & Band Two');
    });

    it('should return a single artist name if no joins exist', () => {
      const artist = new Artist(['Solo Musician']);
      expect(artist.value).toBe('Solo Musician');
    });

    it('should cache the result after the first call', () => {
      const artist = new Artist(['Artist1', 'Artist2'], [' / ']);
      expect(artist.value).toBe('Artist1 / Artist2');
      expect(artist.value).toBe('Artist1 / Artist2'); // Check caching behavior
    });
  });

  describe('asArray', () => {
    it('should return names and joins interleaved', () => {
      const artist = new Artist(['A', 'B', 'C'], [' & ', ' feat. ']);
      expect(artist.asArray).toEqual(['A', '&', 'B', 'feat.', 'C']);
    });

    it('should return only names if no joins are present', () => {
      const artist = new Artist(['X', 'Y']);
      expect(artist.asArray).toEqual(['X', 'Y']);
    });
  });

  describe('fromString', () => {
    it('should split a string correctly into names and joins', () => {
      const artist = Artist.fromString('Band1 & Band2 | Band3');
      expect(artist.names).toEqual(['Band1', 'Band2', 'Band3']);
      expect(artist.joins).toEqual(['&', '|']);
    });

    it('should treat "V/A" as a single entity', () => {
      const artist = Artist.fromString('V/A');
      expect(artist.names).toEqual(['V/A']);
      expect(artist.joins).toEqual([]);
    });

    it('should handle different delimiters', () => {
      const artist = Artist.fromString('A / B + C • D');
      expect(artist.names).toEqual(['A', 'B', 'C', 'D']);
      expect(artist.joins).toEqual(['/', '+', '•']);
    });

    it('should handle spaces around delimiters properly', () => {
      const artist = Artist.fromString('Artist 1 Vs Artist 2');
      expect(artist.names).toEqual(['Artist 1', 'Artist 2']);
      expect(artist.joins).toEqual(['Vs']);
    });
  });

  describe('toString', () => {
    it('should return the same as asString', () => {
      const artist = new Artist(['Artist X', 'Artist Y'], [' & ']);
      expect(artist.toString()).toBe('Artist X & Artist Y');
    });

    it('should correctly return a cached value on multiple calls', () => {
      const artist = new Artist(['Solo Performer']);
      const result1 = artist.toString();
      const result2 = artist.toString();
      expect(result1).toBe(result2);
    });
  });
});
