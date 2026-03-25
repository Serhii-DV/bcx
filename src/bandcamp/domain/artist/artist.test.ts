import { describe, expect, it } from '@rstest/core';
import { Artist } from './artist';

describe('ReleaseArtist', () => {
  describe('constructor', () => {
    it('should correctly initialize names and joins', () => {
      const artist = new Artist(['Artist1', 'Artist2'], ['&']);
      expect(artist.names).toEqual(['Artist1', 'Artist2']);
      expect(artist.joins).toEqual(['&']);
    });

    it('should handle empty joins array', () => {
      const artist = new Artist(['Solo Artist']);
      expect(artist.names).toEqual(['Solo Artist']);
      expect(artist.joins).toEqual([]);
    });
  });

  describe('toString', () => {
    it('should return the correct artist string', () => {
      const artist = new Artist(['Band One', 'Band Two'], ['&']);
      expect(artist.toString()).toBe('Band One & Band Two');
    });

    it('should return a single artist name if no joins exist', () => {
      const artist = new Artist(['Solo Musician']);
      expect(artist.toString()).toBe('Solo Musician');
    });
  });

  describe('toArray', () => {
    it('should return names and joins interleaved', () => {
      const artist = new Artist(['A', 'B', 'C'], ['&', 'feat.']);
      expect(artist.toArray()).toEqual(['A', '&', 'B', 'feat.', 'C']);
    });

    it('should return only names if no joins are present', () => {
      const artist = new Artist(['X', 'Y']);
      expect(artist.toArray()).toEqual(['X', 'Y']);
    });
  });

  describe('parse', () => {
    it('should split a string correctly into names and joins', () => {
      const artist = Artist.parse('Band1 & Band2 | Band3');
      expect(artist.names).toEqual(['Band1', 'Band2', 'Band3']);
      expect(artist.joins).toEqual(['&', '|']);
    });

    it('should handle different delimiters', () => {
      const artist = Artist.parse('A / B + C • D');
      expect(artist.names).toEqual(['A', 'B', 'C', 'D']);
      expect(artist.joins).toEqual(['/', '+', '•']);
    });

    it('should handle spaces around delimiters properly', () => {
      const artist = Artist.parse('Artist 1 Vs Artist 2');
      expect(artist.names).toEqual(['Artist 1', 'Artist 2']);
      expect(artist.joins).toEqual(['Vs']);
    });

    it('should convert artist names to title case', () => {
      const artist = Artist.parse('artist one & artist two');
      expect(artist.names).toEqual(['Artist One', 'Artist Two']);
      expect(artist.joins).toEqual(['&']);
    });

    const VARIOUS_ALIASES = [
      'V/A',
      'VVAA',
      'Various',
      'Various Artist',
      'Various Artists',
    ];

    VARIOUS_ALIASES.forEach((alias) => {
      it(`should treat "${alias}" as "Various Artists"`, () => {
        const artist = Artist.parse(alias);
        expect(artist.names).toEqual(['Various Artists']);
        expect(artist.joins).toEqual([]);
        expect(artist.isVariousArtists).toBe(true);
      });
    });

    const delimiters = [
      ',',
      '&',
      '|',
      '/',
      '+',
      '•',
      'Vs',
      'vs',
      'VS',
      'feat.',
      'ft.',
      'featuring',
    ];

    delimiters.forEach((delimiter) => {
      it(`should handle "${delimiter}" separated artist names`, () => {
        const artist = Artist.parse(`Artist 1${delimiter} Artist 2`);
        expect(artist.names).toEqual(['Artist 1', 'Artist 2']);
        expect(artist.joins).toEqual([delimiter]);
      });
    });
  });
});
