import { MessageType } from './message';

function isExtensionPage(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    !!chrome.runtime?.id &&
    window.location.protocol === 'chrome-extension:'
  );
}

export async function applyMusicFilterQuery(query: string): Promise<void> {
  if (!isExtensionPage()) {
    return;
  }

  await chrome.runtime.sendMessage({
    type: MessageType.APPLY_MUSIC_FILTER_QUERY,
    query,
  });
}

export async function openUrlInActiveTab(url: string): Promise<boolean> {
  if (!isExtensionPage()) {
    return false;
  }

  await chrome.runtime.sendMessage({
    type: MessageType.OPEN_ACTIVE_TAB_URL,
    url,
  });

  return true;
}
