export const copyToClipboard = (content: string): Promise<void> => {
  const clipboard = globalThis.navigator?.clipboard;

  if (clipboard?.writeText) {
    return clipboard.writeText(content);
  }

  return Promise.reject(new Error('The Clipboard API is not available.'));
};
