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
