export function isString(value: any): boolean {
  return typeof value === 'string';
}

export function hasOwnProperty(
  obj: { [key: string]: any },
  key: string,
): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function getJsonFromElementDataAttr(
  selector: string,
  dataAttr: string,
): any {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`Element not found for selector: ${selector}`);

  const attrValue = el.dataset[dataAttr];
  if (!attrValue)
    throw new Error(
      `Element missing [data-${dataAttr}] for selector: ${selector}`,
    );

  return JSON.parse(attrValue);
}
