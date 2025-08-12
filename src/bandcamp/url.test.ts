import { describe, expect, it } from '@rstest/core';
import { isValidBandcampUrl, Url } from './url';

describe('BandcampURL', () => {
  describe('constructor', () => {
    it('should throw an error for an invalid Bandcamp URL', () => {
      const invalidUrl = 'https://example.com';
      expect(() => new Url(invalidUrl)).toThrow('Wrong Bandcamp URL');
    });

    it('should create a BandcampURL object for a valid Bandcamp URL', () => {
      const validUrl = 'https://artist.bandcamp.com/album/album-name';
      const bandcampUrl = new Url(validUrl);
      expect(bandcampUrl).toBeInstanceOf(Url);
      expect(bandcampUrl.url.toString()).toBe(validUrl);
    });
  });

  describe('uuid', () => {
    it('should return the UUID of the URL', () => {
      const validUrl = 'https://artist.bandcamp.com/album/album-name';
      const url = new Url(validUrl);
      expect(url.uuid).toBe('b355ab9c-e629-58ee-a3ab-4a62c674798a');
    });
  });

  describe('hostname', () => {
    it('should return the hostname of the URL', () => {
      const validUrl = 'https://artist.bandcamp.com/album/album-name';
      const bandcampUrl = new Url(validUrl);
      expect(bandcampUrl.hostname).toBe('artist.bandcamp.com');
    });
  });

  describe('hostnameWithProtocol', () => {
    it('should return the protocol and hostname of the URL', () => {
      const validUrl = 'https://artist.bandcamp.com/album/album-name';
      const bandcampUrl = new Url(validUrl);
      expect(bandcampUrl.hostnameWithProtocol).toBe(
        'https://artist.bandcamp.com',
      );
    });
  });

  describe('subdomain', () => {
    it('should return the subdomain of the URL', () => {
      const validUrl = 'https://artist.bandcamp.com/album/album-name';
      const bandcampUrl = new Url(validUrl);
      expect(bandcampUrl.subdomain).toBe('artist');
    });

    it('should return an empty string if there is no subdomain', () => {
      const validUrl = 'https://bandcamp.com';
      const bandcampUrl = new Url(validUrl);
      expect(bandcampUrl.subdomain).toBe('');
    });
  });

  describe('withoutProtocol', () => {
    it('should return the URL without the protocol', () => {
      const validUrl = 'https://artist.bandcamp.com/album/album-name';
      const bandcampUrl = new Url(validUrl);
      expect(bandcampUrl.withoutProtocol).toBe(
        'artist.bandcamp.com/album/album-name',
      );
    });
  });

  describe('withoutQueryParams', () => {
    it('should return the URL without query parameters', () => {
      const validUrl =
        'https://artist.bandcamp.com/album/album-name?ref=source';
      const bandcampUrl = new Url(validUrl);
      expect(bandcampUrl.withoutQueryParams).toBe(
        'https://artist.bandcamp.com/album/album-name',
      );
    });
  });

  describe('pathname', () => {
    it('should return the pathname of the URL', () => {
      const validUrl = 'https://artist.bandcamp.com/album/album-name';
      const bandcampUrl = new Url(validUrl);
      expect(bandcampUrl.pathname).toBe('/album/album-name');
    });
  });

  describe('isRegular', () => {
    it('should return true for regular Bandcamp URLs', () => {
      const validUrl = 'https://bandcamp.com/some-page';
      const bandcampUrl = new Url(validUrl);
      expect(bandcampUrl.isRegular).toBe(true);
    });
  });

  describe('isMusic', () => {
    it('should return true for Bandcamp music pages', () => {
      const validUrl = 'https://artist.bandcamp.com/music';
      const bandcampUrl = new Url(validUrl);
      expect(bandcampUrl.isMusic).toBe(true);
    });

    it('should return false for non-music Bandcamp pages', () => {
      const validUrl = 'https://artist.bandcamp.com/album/album-name';
      const bandcampUrl = new Url(validUrl);
      expect(bandcampUrl.isMusic).toBe(false);
    });
  });

  describe('isAlbum', () => {
    it('should return true for Bandcamp album pages', () => {
      const validUrl = 'https://artist.bandcamp.com/album/album-name';
      const bandcampUrl = new Url(validUrl);
      expect(bandcampUrl.isAlbum).toBe(true);
    });

    it('should return false for non-album Bandcamp pages', () => {
      const validUrl = 'https://artist.bandcamp.com/music';
      const bandcampUrl = new Url(validUrl);
      expect(bandcampUrl.isAlbum).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the full URL as a string', () => {
      const validUrl = 'https://artist.bandcamp.com/album/album-name';
      const bandcampUrl = new Url(validUrl);
      expect(bandcampUrl.toString()).toBe(validUrl);
    });
  });
});

describe('isValidBandcampURL', () => {
  it('should return true for a valid Bandcamp URL', () => {
    const validUrl = 'https://artist.bandcamp.com/album/album-name';
    expect(isValidBandcampUrl(validUrl)).toBe(true);
  });

  it('should return false for an invalid Bandcamp URL', () => {
    const invalidUrl = 'https://example.com';
    expect(isValidBandcampUrl(invalidUrl)).toBe(false);
  });
});
