export function arrayUnique(arr: string[] | string[][]): string[] {
  return [...new Set(arr.flat())];
}

/**
 * Counts the occurrences of each unique element in an array of strings.
 *
 * This function performs case-sensitive counting, treating strings that differ
 * in case as different items (e.g., "Apple" and "apple" are counted separately).
 *
 * @param arr - The array of strings to count occurrences in.
 * @returns A Map where:
 *   - Keys are the exact strings from the input array (preserving original case)
 *   - Values are the number of times each string appeared (case-sensitive count)
 *
 * @example
 * ```typescript
 * const fruits = ['Apple', 'banana', 'APPLE', 'Banana', 'orange'];
 * const counts = countOccurrences(fruits);
 * console.log(counts);
 * // Output: Map(5) { 'Apple' => 1, 'banana' => 1, 'APPLE' => 1, 'Banana' => 1, 'orange' => 1 }
 *
 * console.log(counts.get('Apple')); // 1
 * console.log(counts.get('apple')); // undefined
 * console.log(counts.get('banana')); // 1
 * console.log(counts.get('Banana')); // 1
 * ```
 */
export function countOccurrences(arr: string[]): Map<string, number> {
  const items = new Map<string, number>();

  for (const item of arr) {
    const key = item;
    items.set(key, (items.get(key) || 0) + 1);
  }

  return items;
}
