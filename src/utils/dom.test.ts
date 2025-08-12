import { afterEach, beforeEach, describe, expect, test } from '@rstest/core';
import {
  element,
  elements,
  getDataAttribute,
  hasDataAttribute,
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
});
