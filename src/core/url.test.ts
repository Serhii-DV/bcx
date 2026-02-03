import { describe, expect, it } from '@rstest/core';
import { Url } from './url';

describe('Url', () => {
  describe('create', () => {
    it('should parse an url object for a valid bandcamp url', () => {
      const url = Url.create('https://subdomain.domain.com/path?param=value');
      expect(url).toBeInstanceOf(Url);
      expect(url.toString()).toBe(
        'https://subdomain.domain.com/path?param=value',
      );
      expect(url.hostname).toBe('subdomain.domain.com');
    });
  });

  describe('uuid', () => {
    it('should return the UUID of the URL', () => {
      const url = new Url('https://subdomain.domain.com/path');
      expect(url.uuid).toBe('ecfe4786-eb6b-5f17-b544-355b97153320');
    });

    it('should return the UUID of the URL with search and hash', () => {
      const url = new Url('https://subdomain.domain.com/path?ref=source#hash');
      expect(url.uuid).toBe('c010f3e0-6906-55f7-916e-9e14ec07c625');
    });
  });

  describe('subdomain', () => {
    it('should return the subdomain of the URL', () => {
      const url = new Url('https://subdomain.domain.com/path');
      expect(url.subdomain).toBe('subdomain');
    });

    it('should return an empty string if there is no subdomain', () => {
      const url = new Url('https://bandcamp.com');
      expect(url.subdomain).toBe('');
    });
  });

  describe('withoutProtocol', () => {
    it('should return the URL without the protocol', () => {
      const url = new Url('https://subdomain.domain.com/path');
      expect(url.withoutProtocol).toBe('subdomain.domain.com/path');
    });
  });

  describe('withoutSearch', () => {
    it('should return the URL without query parameters', () => {
      const url = new Url('https://subdomain.domain.com/path?ref=source');
      expect(url.withoutSearch.toString()).toBe(
        'https://subdomain.domain.com/path',
      );
    });
  });

  describe('withoutSearchAndHash', () => {
    it('should return the hostname and pathname of the URL', () => {
      const url = new Url('https://subdomain.domain.com/path?ref=source#hash');
      expect(url.withoutSearchAndHash.toString()).toBe(
        'https://subdomain.domain.com/path',
      );
    });
  });

  describe('withoutPathAndSearchAndHash', () => {
    it('should return the protocol and hostname of the URL', () => {
      const url = new Url('https://subdomain.domain.com');
      expect(url.withoutPathAndSearchAndHash.toString()).toBe(
        'https://subdomain.domain.com/',
      );
    });
    it('should return the protocol and hostname of the URL with path', () => {
      const url = new Url('https://subdomain.domain.com/path');
      expect(url.withoutPathAndSearchAndHash.toString()).toBe(
        'https://subdomain.domain.com/',
      );
    });
  });

  describe('getSearchParam', () => {
    it('should return the value of the specified query parameter', () => {
      const url = new Url(
        'https://subdomain.domain.com/path?ref=source&q=search',
      );
      expect(url.getSearchParam('q')).toBe('search');
      expect(url.getSearchParam('ref')).toBe('source');
    });

    it('should return null if the query parameter does not exist', () => {
      const url = new Url('https://subdomain.domain.com/path?ref=source');
      expect(url.getSearchParam('q')).toBeNull();
    });

    it('should return decoded parameter value', () => {
      const url = new Url(
        'https://subdomain.domain.com/path?q=parameter+with+spaces%26symbols',
      );
      expect(url.getSearchParam('q')).toBe('parameter with spaces&symbols');
    });
  });

  describe('withPath', () => {
    it('should return a new Url instance with the updated path', () => {
      const bandcampUrl = new Url('https://subdomain.domain.com/path-1');
      expect(bandcampUrl.withPath('/path-2').toString()).toBe(
        'https://subdomain.domain.com/path-2',
      );
    });

    it('should add a leading slash if not present in the new path', () => {
      const bandcampUrl = new Url('https://subdomain.domain.com/path-1');
      expect(bandcampUrl.withPath('path-2').toString()).toBe(
        'https://subdomain.domain.com/path-2',
      );
    });
  });
});
