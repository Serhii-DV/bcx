import { describe, expect, it } from '@rstest/core';
import { arrayUnique, createQueryCountMap } from './array';

describe('arrayUnique', () => {
  it('should return an array with unique values', () => {
    expect(arrayUnique(['a', 'b', 'a'])).toEqual(['a', 'b']);
  });
});

describe('countOccurrences', () => {
  it('counts occurrences and returns Map with exact case keys', () => {
    const input = ['Apple', 'Banana', 'apple', 'Orange', 'banana', 'Banana'];
    const result = createQueryCountMap(input);

    expect(result.get('Apple')).toBe(1);
    expect(result.get('apple')).toBe(1);
    expect(result.get('Banana')).toBe(2);
    expect(result.get('banana')).toBe(1);
    expect(result.get('Orange')).toBe(1);
    expect(result.size).toBe(5);
  });

  it('returns an empty Map for empty input', () => {
    const result = createQueryCountMap([]);
    expect(result.size).toBe(0);
    expect(result instanceof Map).toBe(true);
  });

  it('treats differently cased strings as different', () => {
    const input = ['A', 'a', 'A', 'b', 'B'];
    const result = createQueryCountMap(input);

    expect(result.get('A')).toBe(2); // 'A' appears twice
    expect(result.get('a')).toBe(1); // 'a' appears once
    expect(result.get('b')).toBe(1); // 'b' appears once
    expect(result.get('B')).toBe(1); // 'B' appears once
    expect(result.size).toBe(4);
  });

  it('returns count 1 for unique values', () => {
    const input = ['x', 'y', 'z'];
    const result = createQueryCountMap(input);

    expect(result.get('x')).toBe(1);
    expect(result.get('y')).toBe(1);
    expect(result.get('z')).toBe(1);
    expect(result.size).toBe(3);
  });

  it('handles exact case matching properly', () => {
    const input = ['Test', 'TEST', 'test', 'Test'];
    const result = createQueryCountMap(input);

    expect(result.get('Test')).toBe(2);
    expect(result.get('TEST')).toBe(1);
    expect(result.get('test')).toBe(1);
    expect(result.size).toBe(3);
  });

  it('returns undefined for non-existent keys', () => {
    const input = ['apple', 'banana'];
    const result = createQueryCountMap(input);

    expect(result.get('orange')).toBeUndefined();
    expect(result.get('Apple')).toBeUndefined(); // different case
    expect(result.get('BANANA')).toBeUndefined(); // different case
  });

  it('counts identical strings correctly', () => {
    const input = ['same', 'same', 'same'];
    const result = createQueryCountMap(input);

    expect(result.get('same')).toBe(3);
    expect(result.size).toBe(1);
  });
});
