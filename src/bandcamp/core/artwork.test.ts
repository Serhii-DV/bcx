import { describe, expect, it } from '@rstest/core';
import { Artwork } from './artwork';

describe('Art', () => {
  const art = new Artwork(1234567890);

  describe('constructor', () => {
    it('should initialize with an ID', () => {
      expect(art.id).toBe(1234567890);
    });
  });

  describe('size URL getters', () => {
    it('should return correct tiny size URL', () => {
      expect(art.tinySizeUrl).toBe(
        'https://f4.bcbits.com/img/a1234567890_22.jpg',
      );
    });

    it('should return correct small size URL', () => {
      expect(art.smallSizeUrl).toBe(
        'https://f4.bcbits.com/img/a1234567890_3.jpg',
      );
    });

    it('should return correct medium size URL', () => {
      expect(art.mediumSizeUrl).toBe(
        'https://f4.bcbits.com/img/a1234567890_4.jpg',
      );
    });

    it('should return correct large size URL', () => {
      expect(art.largeSizeUrl).toBe(
        'https://f4.bcbits.com/img/a1234567890_5.jpg',
      );
    });

    it('should return correct extra large size URL', () => {
      expect(art.extraLargeSizeUrl).toBe(
        'https://f4.bcbits.com/img/a1234567890_10.jpg',
      );
    });

    it('should return correct huge size URL', () => {
      expect(art.hugeSizeUrl).toBe(
        'https://f4.bcbits.com/img/a1234567890_1.png',
      );
    });

    it('should work with different art IDs', () => {
      const customArt = new Artwork(987654321);
      expect(customArt.mediumSizeUrl).toBe(
        'https://f4.bcbits.com/img/a987654321_4.jpg',
      );
    });
  });

  describe('getUrl', () => {
    it('should generate correct URL for valid size ID', () => {
      const url = art.getUrl(5);
      expect(url).toBe('https://f4.bcbits.com/img/a1234567890_5.jpg');
    });

    it('should generate correct URL for PNG format', () => {
      const url = art.getUrl(1);
      expect(url).toBe('https://f4.bcbits.com/img/a1234567890_1.png');
    });

    it('should return null for invalid size ID', () => {
      const url = art.getUrl(999);
      expect(url).toBeNull();
    });

    it('should use correct Bandcamp URL pattern', () => {
      const url = art.getUrl(5);
      expect(url).toMatch(
        /^https:\/\/f4\.bcbits\.com\/img\/a\d+_\d+\.(jpg|png)$/,
      );
    });

    it('should include art ID in URL', () => {
      const customArt = new Artwork(987654321);
      const url = customArt.getUrl(5);
      expect(url).toContain('a987654321');
    });
  });
});
