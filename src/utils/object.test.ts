import { describe, expect, it } from '@rstest/core';
import { hasOwnProperty, isEqual } from './object';

describe('hasOwnProperty', () => {
  it('returns true only for direct properties', () => {
    const parent = { inherited: true };
    const obj = Object.create(parent) as { own: boolean; inherited: boolean };
    obj.own = true;

    expect(hasOwnProperty(obj, 'own')).toBe(true);
    expect(hasOwnProperty(obj, 'inherited')).toBe(false);
  });

  it('supports symbol keys', () => {
    const key = Symbol('key');
    const obj = { [key]: 'value' };

    expect(hasOwnProperty(obj, key)).toBe(true);
  });
});

describe('isEqual', () => {
  it('compares JSON-serializable values by value', () => {
    expect(isEqual({ a: 1, b: ['x'] }, { a: 1, b: ['x'] })).toBe(true);
    expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
  });
});
