export function onCtrlPlusKey(
  key: string,
  e: KeyboardEvent,
  callback: (e: KeyboardEvent) => void,
): void {
  if (e.key === key && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    callback(e);
  }
}

export function onAltPlusKey(
  key: string,
  e: KeyboardEvent,
  callback: (e: KeyboardEvent) => void,
): void {
  if (e.key === key && e.altKey) {
    e.preventDefault();
    callback(e);
  }
}

export function onCtrlShiftPlusKey(
  key: string,
  e: KeyboardEvent,
  callback: (e: KeyboardEvent) => void,
): void {
  if (e.key.toLowerCase() === key.toLowerCase() && e.ctrlKey && e.shiftKey) {
    e.preventDefault();
    callback(e);
  }
}
