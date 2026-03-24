import { describe, expect, it } from '@rstest/core';
import {
  capitalizeWords,
  containsOneOf,
  removeInvisibleChars,
  splitString,
  trim,
} from './string';

describe('trim', () => {
  it('should trim the specified characters from both ends of the string', () => {
    expect(trim('$$$hello$$$', '$')).toBe('hello');
    expect(trim('###test###', '#')).toBe('test');
  });

  it('should handle strings with no characters to trim', () => {
    expect(trim('hello', '$')).toBe('hello');
    expect(trim('test', '#')).toBe('test');
  });

  it('should trim multiple characters', () => {
    expect(trim('!!@hello@!!', '@!')).toBe('hello');
  });

  it('should remove all characters from both ends if they are in the trim set', () => {
    expect(trim('***', '*')).toBe('');
    expect(trim('!!!', '!')).toBe('');
  });

  it('should return an empty string when the input string is empty', () => {
    expect(trim('', '$')).toBe('');
  });

  it('should handle trimming special characters', () => {
    expect(trim('...hello...', '.')).toBe('hello');
    expect(trim('(!)important(!)', '()!')).toBe('important');
  });

  it('should return the original string if no matching characters are at the ends', () => {
    expect(trim('no-trim-here', '#')).toBe('no-trim-here');
  });

  it('should work with strings containing spaces', () => {
    expect(trim('   hello world   ', ' ')).toBe('hello world');
  });

  it('should correctly handle empty input and trim characters to remove', () => {
    expect(trim('   ', ' ')).toBe('');
    expect(trim('   hello   ', ' ')).toBe('hello');
  });

  it('should correctly escape special characters in the trim string', () => {
    expect(trim('$$$abc$$$', '$')).toBe('abc');
    expect(trim('[abc]', '[]')).toBe('abc');
  });
});

describe('capitalizeWords', () => {
  it('should convert all uppercase to title case', () => {
    expect(capitalizeWords('HELLO WORLD')).toBe('Hello World');
  });

  it('should convert all lowercase to title case', () => {
    expect(capitalizeWords('hello world')).toBe('Hello World');
  });

  it('should handle mixed case', () => {
    expect(capitalizeWords('hElLo WoRLd')).toBe('Hello World');
  });

  it('should handle single word', () => {
    expect(capitalizeWords('test')).toBe('Test');
  });

  it('should handle empty string', () => {
    expect(capitalizeWords('')).toBe('');
  });

  it('should handle multiple spaces', () => {
    expect(capitalizeWords('  hello   world  ')).toBe('  Hello   World  ');
  });

  it('should handle accented characters', () => {
    expect(capitalizeWords('Ördo')).toBe('Ördo');
    expect(capitalizeWords("raison d'être")).toBe("Raison D'Être");
  });

  it('should handle cyrillic characters', () => {
    expect(capitalizeWords('привет мир')).toBe('Привет Мир');
    expect(capitalizeWords('ПРИВЕТ МИР')).toBe('Привет Мир');
    expect(capitalizeWords('дОбРыЙ дЕнЬ')).toBe('Добрый День');
  });

  it('should handle apostrophes and punctuation', () => {
    expect(capitalizeWords("l'amour toujours")).toBe("L'Amour Toujours");
    expect(capitalizeWords("RAISON D'ÊTRE")).toBe("Raison D'Être");
  });

  it('should handle hyphenated words', () => {
    expect(capitalizeWords('self-made man')).toBe('Self-Made Man');
  });

  it('should handle numbers and symbols', () => {
    expect(capitalizeWords('42 is the answer')).toBe('42 Is The Answer');
    expect(capitalizeWords('hello-world!')).toBe('Hello-World!');
  });
});
describe('removeInvisibleChars', () => {
  it('should remove zero-width space character (U+200B)', () => {
    expect(removeInvisibleChars('Hello\u200BWorld')).toBe('HelloWorld');
  });

  it('should remove zero-width non-joiner character (U+200C)', () => {
    expect(removeInvisibleChars('Hello\u200CWorld')).toBe('HelloWorld');
  });

  it('should remove left-to-right mark (U+200E)', () => {
    expect(removeInvisibleChars('Hello\u200EWorld')).toBe('HelloWorld');
  });

  it('should remove right-to-left mark (U+200F)', () => {
    expect(removeInvisibleChars('Hello\u200FWorld')).toBe('HelloWorld');
  });

  it('should remove invisible characters from the middle of a string', () => {
    expect(removeInvisibleChars('Hel\u200Blo\u200FWorld')).toBe('HelloWorld');
  });

  it('should remove invisible characters from the beginning and end of a string', () => {
    expect(removeInvisibleChars('\u200BHello World\u200F')).toBe('Hello World');
  });

  it('should not remove visible characters', () => {
    expect(removeInvisibleChars('Hello World')).toBe('Hello World');
  });

  it('should handle strings with multiple invisible characters', () => {
    expect(removeInvisibleChars('H\u200Bello\u200C World\u200F')).toBe(
      'Hello World',
    );
  });

  it('should handle an empty string correctly', () => {
    expect(removeInvisibleChars('')).toBe('');
  });

  it('should return the same string if no invisible characters are present', () => {
    expect(removeInvisibleChars('Invisible characters should not exist')).toBe(
      'Invisible characters should not exist',
    );
  });

  it('should handle invisible HTML entities like &lrm;', () => {
    expect(removeInvisibleChars('Hello&lrm;World')).toBe('HelloWorld');
  });

  it('should remove all invisible characters and HTML entities', () => {
    expect(removeInvisibleChars('\u200BHello&lrm; World\u200F')).toBe(
      'Hello World',
    );
  });
});

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
