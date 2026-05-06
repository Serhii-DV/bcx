export function hasOwnProperty<T extends object>(
  obj: T,
  key: PropertyKey,
): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function isEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
