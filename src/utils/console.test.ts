import { describe, expect, it } from '@rstest/core';
import { arrayPreview, console } from './console';

describe('arrayPreview', () => {
  it('returns a summary and the first items up to the limit', () => {
    expect(arrayPreview([1, 2, 3, 4], 2)).toEqual(['(2 of 4)', [1, 2]]);
  });

  it('uses the full array when it is shorter than the limit', () => {
    expect(arrayPreview(['a'], 5)).toEqual(['(1 of 1)', ['a']]);
  });
});

describe('console wrapper', () => {
  it('exposes the expected console methods', () => {
    expect(typeof console.log).toBe('function');
    expect(typeof console.error).toBe('function');
    expect(typeof console.debug).toBe('function');
    expect(typeof console.warn).toBe('function');
    expect(typeof console.info).toBe('function');
    expect(typeof console.time).toBe('function');
    expect(typeof console.timeEnd).toBe('function');
  });
});
