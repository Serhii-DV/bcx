import { describe, expect, it } from '@rstest/core';
import { Url } from './url';

describe('Bandcamp Url', () => {
  describe('parse', () => {
    it('should parse an url object for a valid bandcamp url', () => {
      const validUrl =
        'https://artist.bandcamp.com/album/album-name?param=value';
      const url = Url.parse(validUrl);
      expect(url).toBeInstanceOf(Url);
      expect(url.toString()).toBe(validUrl);
      expect(url.isBandcamp).toBe(true);
    });
  });

  describe('uuid', () => {
    it('should return the UUID of the URL', () => {
      const validUrl = 'https://artist.bandcamp.com/album/album-name';
      const url = new Url(validUrl);
      expect(url.uuid).toBe('b355ab9c-e629-58ee-a3ab-4a62c674798a');
    });
  });

  describe('hostnameWithProtocol', () => {
    it('should return the protocol and hostname of the URL', () => {
      const validUrl = 'https://artist.bandcamp.com/album/album-name';
      const url = new Url(validUrl);
      expect(url.hostnameWithProtocol).toBe('https://artist.bandcamp.com');
    });
  });

  describe('bandUrl', () => {
    it('should return the base band URL', () => {
      const validUrl = 'https://artist.bandcamp.com/album/album-name';
      const url = new Url(validUrl);
      expect(url.bandUrl.toString()).toBe('https://artist.bandcamp.com/');
    });
  });

  describe('subdomain', () => {
    it('should return the subdomain of the URL', () => {
      const validUrl = 'https://artist.bandcamp.com/album/album-name';
      const url = new Url(validUrl);
      expect(url.subdomain).toBe('artist');
    });

    it('should return an empty string if there is no subdomain', () => {
      const validUrl = 'https://bandcamp.com';
      const url = new Url(validUrl);
      expect(url.subdomain).toBe('');
    });
  });

  describe('withoutProtocol', () => {
    it('should return the URL without the protocol', () => {
      const validUrl = 'https://artist.bandcamp.com/album/album-name';
      const url = new Url(validUrl);
      expect(url.withoutProtocol).toBe('artist.bandcamp.com/album/album-name');
    });
  });

  describe('withoutQueryParams', () => {
    it('should return the URL without query parameters', () => {
      const validUrl =
        'https://artist.bandcamp.com/album/album-name?ref=source';
      const url = new Url(validUrl);
      expect(url.withoutQueryParams).toBe(
        'https://artist.bandcamp.com/album/album-name',
      );
    });
  });

  describe('getQueryParam', () => {
    it('should return the value of the specified query parameter', () => {
      const validUrl =
        'https://artist.bandcamp.com/album/album-name?ref=source&q=search';
      const url = new Url(validUrl);
      expect(url.getQueryParam('q')).toBe('search');
      expect(url.getQueryParam('ref')).toBe('source');
    });

    it('should return null if the query parameter does not exist', () => {
      const validUrl =
        'https://artist.bandcamp.com/album/album-name?ref=source';
      const url = new Url(validUrl);
      expect(url.getQueryParam('q')).toBeNull();
    });

    it('should return decoded parameter value', () => {
      const validUrl =
        'https://artist.bandcamp.com/album/album-name?q=God+Body+Disconnect';
      const url = new Url(validUrl);
      expect(url.getQueryParam('q')).toBe('God Body Disconnect');
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

    it('should return true for Bandcamp music pages with URL query parameters (end with `music`)', () => {
      const validUrl = 'https://artist.bandcamp.com/music?q=search';
      const bandcampUrl = new Url(validUrl);
      expect(bandcampUrl.isMusic).toBe(true);
    });

    it('should return true for Bandcamp music pages with URL query parameters (end with `music/`)', () => {
      const validUrl = 'https://artist.bandcamp.com/music/?q=search';
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

  describe('isTrack', () => {
    it('should return true for Bandcamp track pages', () => {
      const validUrl = 'https://artist.bandcamp.com/track/track-name';
      const bandcampUrl = new Url(validUrl);
      expect(bandcampUrl.isTrack).toBe(true);
    });

    it('should return false for non-track Bandcamp pages', () => {
      const validUrl = 'https://artist.bandcamp.com/album/album-name';
      const bandcampUrl = new Url(validUrl);
      expect(bandcampUrl.isTrack).toBe(false);
    });
  });

  describe('withPath', () => {
    it('should return a new Url instance with the updated path', () => {
      const validUrl = 'https://artist.bandcamp.com/album/album-name';
      const bandcampUrl = new Url(validUrl);
      const newPath = '/music';
      const newUrl = bandcampUrl.withPath(newPath);
      expect(newUrl.toString()).toBe('https://artist.bandcamp.com/music');
    });

    it('should add a leading slash if not present in the new path', () => {
      const validUrl = 'https://artist.bandcamp.com/album/album-name';
      const bandcampUrl = new Url(validUrl);
      const newPath = 'music';
      const newUrl = bandcampUrl.withPath(newPath);
      expect(newUrl.toString()).toBe('https://artist.bandcamp.com/music');
    });
  });
});
