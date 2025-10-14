import { describe, expect, it } from '@rstest/core';
import { ArtworkSize } from './artworkSize';

describe('ArtSize', () => {
  describe('getById', () => {
    it('should return correct art size info for valid ID', () => {
      const size = ArtworkSize.getById(1);
      expect(size).toEqual({
        id: 1,
        width: 4000,
        height: 4000,
        format: 'png',
      });
    });

    it('should return undefined for invalid ID', () => {
      const size = ArtworkSize.getById(999);
      expect(size).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all 29 art sizes', () => {
      const sizes = ArtworkSize.getAll();
      expect(sizes).toHaveLength(29);
    });

    it('should return array of ArtSizeInfo objects', () => {
      const sizes = ArtworkSize.getAll();
      expect(sizes[0]).toHaveProperty('id');
      expect(sizes[0]).toHaveProperty('width');
      expect(sizes[0]).toHaveProperty('height');
      expect(sizes[0]).toHaveProperty('format');
    });
  });

  describe('getIds', () => {
    it('should return all size IDs', () => {
      const ids = ArtworkSize.getIds();
      expect(ids).toContain(1);
      expect(ids).toContain(22);
      expect(ids).toContain(200);
      expect(ids).toHaveLength(29);
    });
  });

  describe('constants', () => {
    it('should have correct constant values', () => {
      expect(ArtworkSize.TINY).toBe(22);
      expect(ArtworkSize.SMALL).toBe(3);
      expect(ArtworkSize.MEDIUM).toBe(4);
      expect(ArtworkSize.LARGE).toBe(5);
      expect(ArtworkSize.EXTRA_LARGE).toBe(10);
      expect(ArtworkSize.HUGE).toBe(1);
    });
  });

  describe('findClosestSize', () => {
    it('should find closest size for exact match', () => {
      const id = ArtworkSize.findClosestSize(300, 300);
      expect(id).toBe(4); // or 23 or 24, all are 300x300
    });

    it('should find closest size for approximate dimensions', () => {
      const id = ArtworkSize.findClosestSize(350, 350);
      expect(id).toBe(2); // 350x350
    });

    it('should find closest size for very large dimensions', () => {
      const id = ArtworkSize.findClosestSize(5000, 5000);
      expect(id).toBe(1); // 4000x4000 is the largest
    });

    it('should find closest size for very small dimensions', () => {
      const id = ArtworkSize.findClosestSize(20, 20);
      expect(id).toBe(22); // 25x25 is the smallest
    });
  });

  describe('getByFormat', () => {
    it('should return only JPG formats', () => {
      const jpgSizes = ArtworkSize.getByFormat('jpg');
      expect(jpgSizes.every((size) => size.format === 'jpg')).toBe(true);
      expect(jpgSizes.length).toBeGreaterThan(0);
    });

    it('should return only PNG formats', () => {
      const pngSizes = ArtworkSize.getByFormat('png');
      expect(pngSizes.every((size) => size.format === 'png')).toBe(true);
      expect(pngSizes).toHaveLength(2); // IDs 1 and 31
    });
  });

  describe('getSizesInRange', () => {
    it('should return sizes within specified range', () => {
      const sizes = ArtworkSize.getSizesInRange(100, 300);
      expect(
        sizes.every((size) => size.width >= 100 && size.width <= 300),
      ).toBe(true);
    });

    it('should return empty array for invalid range', () => {
      const sizes = ArtworkSize.getSizesInRange(5000, 6000);
      expect(sizes).toHaveLength(0);
    });
  });

  describe('exists', () => {
    it('should return true for valid ID', () => {
      expect(ArtworkSize.exists(1)).toBe(true);
      expect(ArtworkSize.exists(200)).toBe(true);
    });

    it('should return false for invalid ID', () => {
      expect(ArtworkSize.exists(999)).toBe(false);
      expect(ArtworkSize.exists(-1)).toBe(false);
    });
  });

  describe('getLargest', () => {
    it('should return the largest size', () => {
      const largest = ArtworkSize.getLargest();
      expect(largest.id).toBe(1);
      expect(largest.width).toBe(4000);
      expect(largest.height).toBe(4000);
    });
  });

  describe('getSmallest', () => {
    it('should return the smallest size', () => {
      const smallest = ArtworkSize.getSmallest();
      expect(smallest.id).toBe(22);
      expect(smallest.width).toBe(25);
      expect(smallest.height).toBe(25);
    });
  });
});
