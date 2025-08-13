import { isString } from './utils';

export function element(
  selector: string,
  parent?: Element | ShadowRoot | null,
): HTMLElement | null {
  return (parent ? parent : document).querySelector(selector);
}

export function elements(
  selector: string,
  parent?: Element | ShadowRoot | null,
): HTMLElement[] {
  return Array.from(
    (parent ? parent : document).querySelectorAll(selector),
  ) as HTMLElement[];
}

export function hasDataAttribute(
  element: Element,
  attributeName: string,
): boolean {
  return element.hasAttribute(`data-${attributeName}`);
}

export function getDataAttribute(
  element: Element,
  attributeName: string,
  defaultValue: string = '',
): string {
  if (hasDataAttribute(element, attributeName)) {
    const value = element.getAttribute(`data-${attributeName}`);
    return value !== null ? value : defaultValue;
  }
  return defaultValue;
}

export function setDataAttribute(
  element: Element,
  attributeName: string | Record<string, string>,
  attributeValue: string = '',
): void {
  if (isString(attributeName)) {
    element.setAttribute(`data-${attributeName}`, attributeValue);
    return;
  }

  const obj = attributeName as Record<string, string>;
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      setDataAttribute(element, key, obj[key]);
    }
  }
}

/**
 * Injects a CSS file into the document by creating a link element.
 */
export function injectCSSFile(
  cssUrl: string,
  callback: ((this: GlobalEventHandlers, ev: Event) => any) | null = null,
  target: Document | ShadowRoot = document,
): void {
  const linkElement = document.createElement('link');
  linkElement.rel = 'stylesheet';
  linkElement.href = cssUrl;
  linkElement.onload = (event) => {
    console.log('Injected css file:', cssUrl);
    if (callback) {
      callback.call(linkElement, event);
    }
  };

  if (target instanceof Document) {
    target.head.appendChild(linkElement);
  } else {
    target.appendChild(linkElement);
  }
}

/**
 * Injects a JavaScript file into the document by creating a script element.
 */
export function injectJSFile(
  url: string,
  callback: ((this: GlobalEventHandlers, ev: Event) => any) | null = null,
): void {
  const scriptElement = document.createElement('script');
  scriptElement.src = url;
  scriptElement.onload = callback;
  (document.head || document.documentElement).appendChild(scriptElement);
}
