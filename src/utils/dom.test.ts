import {
  afterEach,
  beforeEach,
  describe,
  expect,
  rstest,
  test,
} from '@rstest/core';
import {
  createDataList,
  createDataListForInput,
  createElement,
  element,
  elementHtml,
  elements,
  getDataAttribute,
  getJsonFromElementDataAttr,
  hasDataAttribute,
  injectCssFile,
  injectJSFile,
  onClick,
  onDOMReady,
  setDataAttribute,
} from './dom';

describe('Element getting', () => {
  let testElement: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="parent">
        <div id="child1" class="test-class" data-attr="value"></div>
        <div id="child2"></div>
      </div>
    `;

    testElement = document.getElementById('child1') as HTMLElement;
  });

  afterEach(() => {
    document.body.innerHTML = ''; // Cleanup
    testElement = null as any; // Reset reference
  });

  test('element() should select a single element', () => {
    const result = element('#child1');
    expect(result).toBe(testElement);
  });

  test('elements() should select multiple elements', () => {
    const results = elements('.test-class');
    expect(results).toHaveLength(1);
    expect(results[0]).toBe(testElement);
  });

  test('hasDataAttribute() should check for a data attribute', () => {
    expect(hasDataAttribute(testElement, 'attr')).toBe(true);
    expect(hasDataAttribute(testElement, 'nonexistent')).toBe(false);
  });

  test('setDataAttribute() should set data attributes', () => {
    setDataAttribute(testElement, 'newAttr', 'newValue');
    expect(testElement.getAttribute('data-newAttr')).toBe('newValue');

    setDataAttribute(testElement, { multi1: 'val1', multi2: 'val2' });
    expect(testElement.getAttribute('data-multi1')).toBe('val1');
    expect(testElement.getAttribute('data-multi2')).toBe('val2');
  });

  test('getDataAttribute() should retrieve data attributes with a fallback', () => {
    expect(getDataAttribute(testElement, 'attr', 'default')).toBe('value');
    expect(getDataAttribute(testElement, 'nonexistent', 'default')).toBe(
      'default',
    );
  });

  test('elementHtml() should return the document root element', () => {
    expect(elementHtml()).toBe(document.documentElement);
  });

  test('createElement() should create an element from an HTML string', () => {
    const created = createElement('<button type="button">Click</button>');

    expect(created?.tagName).toBe('BUTTON');
    expect(created?.textContent).toBe('Click');
  });

  test('getJsonFromElementDataAttr() should parse JSON from data attributes', () => {
    document.body.innerHTML = '<div id="data" data-blob=\'{"ok":true}\'></div>';

    expect(getJsonFromElementDataAttr('#data', 'blob')).toEqual({ ok: true });
  });

  test('getJsonFromElementDataAttr() should throw for missing elements', () => {
    expect(() => getJsonFromElementDataAttr('#missing', 'blob')).toThrow(
      'Element not found for selector: #missing',
    );
  });

  test('injectCssFile() should append a stylesheet and resolve on load', async () => {
    const promise = injectCssFile('/style.css');
    const link = document.head.querySelector<HTMLLinkElement>(
      'link[href="/style.css"]',
    );

    link?.onload?.(new Event('load'));

    await expect(promise).resolves.toBe(link);
    expect(link?.rel).toBe('stylesheet');
  });

  test('injectCssFile() should reject on load error', async () => {
    const promise = injectCssFile('/missing.css');
    const link = document.head.querySelector<HTMLLinkElement>(
      'link[href="/missing.css"]',
    );

    link?.onerror?.(new Event('error'));

    await expect(promise).rejects.toThrow(
      'Failed to load CSS file: /missing.css',
    );
  });

  test('injectJSFile() should append a script and attach the callback', () => {
    const callback = rstest.fn();

    injectJSFile('/script.js', callback);
    const script = document.head.querySelector<HTMLScriptElement>(
      'script[src="/script.js"]',
    );

    expect(script).not.toBeNull();
    script?.onload?.(new Event('load'));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('createDataList() should create options from values', () => {
    const datalist = createDataList(['black', 'metal'], 'genres');

    expect(datalist.id).toBe('genres');
    expect(Array.from(datalist.options).map((option) => option.value)).toEqual([
      'black',
      'metal',
    ]);
  });

  test('createDataListForInput() should append a datalist and connect it to input', () => {
    const input = document.createElement('input');
    input.id = 'filter';
    document.body.appendChild(input);

    const datalist = createDataListForInput(['ambient'], input);

    expect(document.body.contains(datalist)).toBe(true);
    expect(datalist.id).toBe('filter-list');
    expect(input.getAttribute('list')).toBe('filter-list');
  });

  test('onDOMReady() should run callback after DOMContentLoaded when loading', () => {
    const callback = rstest.fn();
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true,
    });

    onDOMReady(callback);
    expect(callback).not.toHaveBeenCalled();

    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  test('onClick() should attach click handlers to one element, arrays, and NodeLists', () => {
    document.body.innerHTML = `
      <button class="target"></button>
      <button class="target"></button>
    `;
    const buttons = document.querySelectorAll<HTMLButtonElement>('.target');
    const singleCallback = rstest.fn();
    const arrayCallback = rstest.fn();
    const nodeListCallback = rstest.fn();

    onClick(buttons[0], singleCallback);
    onClick(Array.from(buttons), arrayCallback);
    onClick(buttons, nodeListCallback);

    buttons[0].click();
    buttons[1].click();

    expect(singleCallback).toHaveBeenCalledTimes(1);
    expect(arrayCallback).toHaveBeenCalledTimes(2);
    expect(nodeListCallback).toHaveBeenCalledTimes(2);
  });
});
