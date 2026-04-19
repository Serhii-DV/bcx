import { console } from './console';

export const copyToClipboard = (content: string): Promise<void> => {
  const clipboard = globalThis.navigator?.clipboard;

  if (clipboard?.writeText) {
    return clipboard.writeText(content).then(
      () => {
        console.debug('Copied to clipboard:', content);
      },
      (err) => {
        console.error('Failed to copy to clipboard:', err);
        throw err;
      },
    );
  }

  return Promise.reject(new Error('The Clipboard API is not available.'));
};
