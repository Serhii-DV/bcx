import { describe, expect, it, rstest } from '@rstest/core';
import { onAltPlusKey, onCtrlPlusKey, onCtrlShiftPlusKey } from './keyboard';

function keyboardEvent(key: string, options: KeyboardEventInit = {}) {
  return new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
}

describe('keyboard shortcuts', () => {
  it('runs callback for Ctrl plus key and prevents default', () => {
    const callback = rstest.fn();
    const event = keyboardEvent('k', { ctrlKey: true });

    onCtrlPlusKey('k', event, callback);

    expect(callback).toHaveBeenCalledWith(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('runs callback for Meta plus key', () => {
    const callback = rstest.fn();
    const event = keyboardEvent('k', { metaKey: true });

    onCtrlPlusKey('k', event, callback);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does not run callback when Ctrl shortcut does not match', () => {
    const callback = rstest.fn();

    onCtrlPlusKey('k', keyboardEvent('x', { ctrlKey: true }), callback);

    expect(callback).not.toHaveBeenCalled();
  });

  it('runs callback for Alt plus key', () => {
    const callback = rstest.fn();
    const event = keyboardEvent('x', { altKey: true });

    onAltPlusKey('x', event, callback);

    expect(callback).toHaveBeenCalledWith(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('runs callback for Ctrl+Shift plus key case-insensitively', () => {
    const callback = rstest.fn();
    const event = keyboardEvent('X', { ctrlKey: true, shiftKey: true });

    onCtrlShiftPlusKey('x', event, callback);

    expect(callback).toHaveBeenCalledWith(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
