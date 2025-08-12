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
