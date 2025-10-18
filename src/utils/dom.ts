import { console } from './console';
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

export function elementHtml(): HTMLElement | null {
  return document.documentElement;
}

export function createElement(htmlString: string): HTMLElement | null {
  const div = document.createElement('div');
  div.innerHTML = htmlString.trim();
  return div.firstChild as HTMLElement | null;
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
 * Returns a Promise that resolves when the CSS file is loaded.
 */
export function injectCssFile(
  cssUrl: string,
  target: Document | ShadowRoot = document,
): Promise<HTMLLinkElement> {
  return new Promise((resolve, reject) => {
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = cssUrl;

    linkElement.onload = () => {
      console.log('Injected CSS file:', cssUrl);
      resolve(linkElement);
    };

    linkElement.onerror = (error) => {
      console.error('Failed to inject CSS file:', cssUrl, error);
      reject(new Error(`Failed to load CSS file: ${cssUrl}`));
    };

    if (target instanceof Document) {
      target.head.appendChild(linkElement);
    } else {
      target.appendChild(linkElement);
    }
  });
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

/**
 * Creates a datalist element with options from the given array of strings
 * @param options Array of strings to use as datalist options
 * @param dataListId ID to assign to the datalist element
 * @returns The created datalist element
 */
export function createDataList(
  options: string[],
  dataListId: string,
): HTMLDataListElement {
  const datalist = document.createElement('datalist');
  datalist.id = dataListId;

  options.forEach((optionText) => {
    const option = document.createElement('option');
    option.value = optionText;
    datalist.appendChild(option);
  });

  return datalist;
}

/**
 * Creates a datalist and attaches it to the DOM, then returns the ID
 * @param options Array of strings to use as datalist options
 * @param inputElement Optional input element to associate with the datalist
 * @returns The created datalist element
 */
export function createDataListForInput(
  options: string[],
  inputElement?: HTMLInputElement,
): HTMLDataListElement {
  const listId = inputElement?.id
    ? `${inputElement.id}-list`
    : `datalist-${Math.random().toString(36).substring(2, 9)}`;

  const datalist = createDataList(options, listId);

  document.body.appendChild(datalist);

  if (inputElement) {
    inputElement.setAttribute('list', listId);
  }

  return datalist;
}

/**
 * Executes a callback function when the DOM is ready.
 * If the document is already loaded, the callback is executed immediately.
 * Otherwise, it waits for the DOMContentLoaded event.
 * @param callback The function to execute when DOM is ready
 */
export function onDOMReady(callback: () => void | Promise<void>): void {
  const safeCall = () => {
    try {
      const result = callback();
      if (result instanceof Promise) {
        result.catch((err) => {
          console.error('onDOMReady callback error:', err);
        });
      }
    } catch (err) {
      console.error('onDOMReady callback error:', err);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeCall);
  } else {
    safeCall();
  }

  if (document.readyState === 'complete') {
    setTimeout(safeCall, 100);
  }
}
