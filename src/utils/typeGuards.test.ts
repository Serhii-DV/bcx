import { describe, expect, it } from '@rstest/core';
import { isString } from './typeGuards';

describe('isString', () => {
  it('should return true for a string', () => {
    expect(isString('hello')).toBe(true);
  });

  it('should return false for non-string values', () => {
    expect(isString(123)).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
  });
});
