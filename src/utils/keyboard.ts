export function onCtrlKey(
  key: string,
  e: KeyboardEvent,
  callback: (e: KeyboardEvent) => void,
): void {
  if (e.key === key && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    callback(e);
  }
}
