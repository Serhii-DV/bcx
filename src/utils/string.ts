export function trim(inputString: string, charactersToTrim: string): string {
  // Escape special characters within the provided string and construct the regex pattern
  const escapedCharacters = charactersToTrim.replace(
    /[-/\\^$*+?.()|[\]{}]/g,
    '\\$&',
  );
  const regexPattern = new RegExp(
    `^[${escapedCharacters}]+|[${escapedCharacters}]+$`,
    'g',
  );
  const trimmedString = inputString.replace(regexPattern, '');

  return trimmedString;
}

export function removeInvisibleChars(inputString: string): string {
  // Define the invisible character(s) you want to remove (for example, non-breaking space)
  const invisibleCharsRegex =
    /[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]|&lrm;/g;
  const cleanedString = inputString.replace(invisibleCharsRegex, '');

  return cleanedString;
}

/**
 * Removes all parentheses and their contents from a string and trims extra spaces.
 *
 * @param input The string to process
 * @returns A new string with all parentheses and their contents removed and extra spaces trimmed
 *
 * @example
 * // Returns "Hello world"
 * removeParentheses("Hello (beautiful) world");
 */
export function removeParentheses(input: string): string {
  // Remove parentheses and their contents
  const withoutParentheses = input.replace(/\([^)]*\)/g, '');

  // Replace multiple spaces with a single space and trim
  return withoutParentheses.replace(/\s+/g, ' ').trim();
}

/**
 * Splits a string into an array of substrings using specified delimiters, trims whitespace, and removes empty entries.
 *
 * @param inputString - The string to be split.
 * @param delimiters - A regular expression or string specifying the delimiter(s) to use for splitting.
 * @returns An array of non-empty, trimmed substrings resulting from the split operation.
 */
export function splitString(
  inputString: string,
  delimiters: RegExp | string,
): string[] {
  const resultArray = inputString.split(delimiters);
  return resultArray
    .map((item: string) => item.trim())
    .filter((item: string) => item !== '');
}

/**
 * Checks if a string contains any of the strings in a given array.
 *
 * @param string1 - The string to check.
 * @param arrayOfStrings - An array of strings to look for.
 * @returns True if `string1` contains any of the strings in `arrayOfStrings`; otherwise, false.
 */
export function containsOneOf(
  string1: string,
  arrayOfStrings: string[],
): boolean {
  // Return false immediately if string1 is empty
  if (string1 === '') return false;
  const lcString = string1.toLowerCase();

  // Check each string in the array, converted to lowercase for case-insensitive comparison
  for (const string2 of arrayOfStrings) {
    if (string2 === '') continue;
    if (lcString.includes(string2.toLowerCase())) {
      return true;
    }
  }
  return false;
}

/**
 * Converts a string to title case where the first letter of each word is uppercase
 * and all other letters are lowercase. Supports Latin and Cyrillic characters.
 *
 * @param input - The string to convert to title case.
 * @returns A new string with the first letter of each word capitalized and other letters lowercase.
 *
 * @example
 * // Returns "Hello World"
 * toTitleCase("HELLO WORLD");
 *
 * @example
 * // Returns "Привет Мир"
 * toTitleCase("привет мир");
 */
export function capitalizeWords(input: string): string {
  // Split by word boundaries, preserving spaces and punctuation
  return input.replace(/([\p{L}]+)/gu, (word) => {
    // If the word is all uppercase or mixed, convert first letter to uppercase, rest to lowercase
    if (word.length === 0) return word;
    const [first, ...rest] = word;
    return first.toLocaleUpperCase() + rest.join('').toLocaleLowerCase();
  });
}
