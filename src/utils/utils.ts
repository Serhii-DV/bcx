export function isString(value: any): boolean {
  return typeof value === 'string';
}

export function hasOwnProperty(
  obj: { [key: string]: any },
  key: string,
): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
