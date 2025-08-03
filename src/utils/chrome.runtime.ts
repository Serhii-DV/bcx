export function getExtensionUrl(path: string): string {
  return chrome.runtime.getURL(path);
}
