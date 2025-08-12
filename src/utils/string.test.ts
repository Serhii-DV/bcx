import { describe, expect, it } from '@rstest/core';
import { containsOneOf, splitString } from './string';

describe('splitString', () => {
  it('should split a string by a single delimiter', () => {
    expect(splitString('apple,banana,orange', ',')).toEqual([
      'apple',
      'banana',
      'orange',
    ]);
  });

  it('should split a string by multiple delimiters', () => {
    expect(splitString('apple, banana; orange', /[,\s;]/)).toEqual([
      'apple',
      'banana',
      'orange',
    ]);
  });

  it('should trim whitespace from substrings', () => {
    expect(splitString('  apple  ,   banana  , orange  ', ',')).toEqual([
      'apple',
      'banana',
      'orange',
    ]);
  });

  it('should remove empty entries after splitting', () => {
    expect(splitString('apple,,banana,,orange', ',')).toEqual([
      'apple',
      'banana',
      'orange',
    ]);
  });

  it('should handle multiple consecutive delimiters correctly', () => {
    expect(splitString('apple,,banana,,,orange', ',')).toEqual([
      'apple',
      'banana',
      'orange',
    ]);
  });

  it('should handle empty string', () => {
    expect(splitString('', ',')).toEqual([]);
  });

  it('should return an empty array when no non-empty substrings remain', () => {
    expect(splitString('  , , ,  ', ',')).toEqual([]);
  });

  it('should split by a regex with special characters', () => {
    expect(splitString('apple!banana!orange', /[!]/)).toEqual([
      'apple',
      'banana',
      'orange',
    ]);
  });

  it('should handle strings with only delimiters', () => {
    expect(splitString(',,,,', ',')).toEqual([]);
  });

  it('should return a single item if there is no delimiter', () => {
    expect(splitString('apple', ',')).toEqual(['apple']);
  });

  it('should handle complex delimiters (spaces, commas, semicolons, etc.)', () => {
    expect(splitString('apple banana,orange ;grape', /[\s,;]+/)).toEqual([
      'apple',
      'banana',
      'orange',
      'grape',
    ]);
  });

  it('should handle multiple delimiters with spaces correctly', () => {
    expect(splitString('apple, banana ; orange  ', /[\s,;]+/)).toEqual([
      'apple',
      'banana',
      'orange',
    ]);
  });
});

describe('containsOneOf', () => {
  it('should return true if string1 contains any string from the array', () => {
    expect(containsOneOf('apple pie', ['apple', 'banana', 'orange'])).toBe(
      true,
    );
    expect(containsOneOf('Hello world!', ['world', 'earth'])).toBe(true);
  });

  it('should return false if string1 contains none of the strings from the array', () => {
    expect(containsOneOf('apple pie', ['banana', 'orange', 'grape'])).toBe(
      false,
    );
    expect(containsOneOf('Hello world!', ['earth', 'mars'])).toBe(false);
    expect(containsOneOf('apple', ['', 'banana'])).toBe(false);
  });

  it('should return true if string1 contains a string from the array with case insensitivity', () => {
    expect(containsOneOf('Apple Pie', ['apple', 'banana', 'orange'])).toBe(
      true,
    );
    expect(containsOneOf('HELLO world!', ['world', 'earth'])).toBe(true);
  });

  it('should return false if the array is empty', () => {
    expect(containsOneOf('apple pie', [])).toBe(false);
  });

  it('should return true if string1 matches exactly with a string in the array', () => {
    expect(containsOneOf('apple', ['apple', 'banana', 'orange'])).toBe(true);
    expect(containsOneOf('hello', ['hello', 'world'])).toBe(true);
  });

  it('should return false for empty strings', () => {
    expect(containsOneOf('', ['apple', 'banana'])).toBe(false);
  });

  it('should return true if string1 contains a partial match from the array', () => {
    expect(containsOneOf('I love apple pie', ['apple', 'banana'])).toBe(true);
    expect(containsOneOf('I like banana bread', ['apple', 'banana'])).toBe(
      true,
    );
  });

  it('should handle large arrays efficiently', () => {
    const largeArray = Array(1000).fill('apple');
    expect(containsOneOf('I like apple pie', largeArray)).toBe(true);
    expect(containsOneOf('I like banana pie', largeArray)).toBe(false);
  });
});
