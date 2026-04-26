import { console } from 'src/utils/console';
import { History } from './core/history';
import { type Message, MessageType } from './core/message';

console.log('Running background script');

const SIDEPANEL_PATH = 'sidepanel.html';
const BANDCAMP_HOST_PATTERN = /(^|\.)bandcamp\.com$/;
const activeBandcampPageDataByTabId = new Map<
  number,
  { hostname: string; pageData: unknown }
>();

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed!');
  chrome.storage.session
    .setAccessLevel({
      accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
    })
    .catch(console.error);
});

chrome.sidePanel
  ?.setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error);

chrome.tabs.onUpdated.addListener((tabId, _changeInfo, tab) => {
  updateSidePanelOptions(tabId, tab.url).catch(console.error);
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) {
      console.warn('Failed to read activated tab:', chrome.runtime.lastError);
      return;
    }

    updateSidePanelOptions(tabId, tab.url).catch(console.error);
  });
});

async function updateSidePanelOptions(
  tabId: number,
  tabUrl?: string,
): Promise<void> {
  if (!chrome.sidePanel) {
    return;
  }

  await chrome.sidePanel.setOptions({
    tabId,
    path: SIDEPANEL_PATH,
    enabled: isBandcampTabUrl(tabUrl),
  });
}

function isBandcampTabUrl(tabUrl?: string): boolean {
  if (!tabUrl) {
    return false;
  }

  try {
    const url = new URL(tabUrl);
    return url.protocol === 'https:' && BANDCAMP_HOST_PATTERN.test(url.host);
  } catch {
    return false;
  }
}

async function getActiveBandcampTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab || !tab.id || !isBandcampTabUrl(tab.url)) {
    return null;
  }

  return tab;
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    if (message.type === MessageType.HISTORY_SEARCH) {
      History.search(message.query)
        .then((results) => {
          sendResponse({ results });
        })
        .catch((error) => {
          console.error('History search failed:', error);
          sendResponse({ error: error.message });
        });

      // Return true to indicate async response
      return true;
    }

    if (message.type === MessageType.GET_ACTIVE_BANDCAMP_TAB) {
      getActiveBandcampTab()
        .then((tab) => {
          sendResponse({
            tab: tab
              ? {
                  id: tab.id,
                  url: tab.url,
                  title: tab.title,
                  windowId: tab.windowId,
                }
              : null,
          });
        })
        .catch((error) => {
          console.error('Failed to get active Bandcamp tab:', error);
          sendResponse({ error: error.message });
        });

      return true;
    }

    if (message.type === MessageType.GET_ACTIVE_BANDCAMP_PAGE_DATA) {
      getActiveBandcampTab()
        .then((tab) => {
          if (!tab?.id) {
            sendResponse({ pageData: null, error: 'No active Bandcamp tab' });
            return;
          }

          const cachedPageData = getCachedPageData(tab);

          chrome.tabs.sendMessage(
            tab.id,
            { type: MessageType.GET_ACTIVE_BANDCAMP_PAGE_DATA },
            (response) => {
              if (chrome.runtime.lastError) {
                sendResponse({
                  pageData: cachedPageData,
                  error: chrome.runtime.lastError.message,
                });
                return;
              }

              if (response?.pageData) {
                cachePageData(tab, response.pageData);
              }

              sendResponse(response ?? { pageData: null });
            },
          );
        })
        .catch((error) => {
          console.error('Failed to get active Bandcamp page data:', error);
          sendResponse({ pageData: null, error: error.message });
        });

      return true;
    }

    if (message.type === MessageType.APPLY_MUSIC_FILTER_QUERY) {
      getActiveBandcampTab()
        .then((tab) => {
          if (!tab?.id) {
            sendResponse({ ok: false, error: 'No active Bandcamp tab' });
            return;
          }

          chrome.tabs.sendMessage(
            tab.id,
            {
              type: MessageType.APPLY_MUSIC_FILTER_QUERY,
              query: message.query,
            },
            (response) => {
              if (chrome.runtime.lastError) {
                sendResponse({
                  ok: false,
                  error: chrome.runtime.lastError.message,
                });
                return;
              }

              sendResponse(response ?? { ok: true });
            },
          );
        })
        .catch((error) => {
          console.error('Failed to apply music filter query:', error);
          sendResponse({ ok: false, error: error.message });
        });

      return true;
    }

    if (message.type === MessageType.OPEN_ACTIVE_TAB_URL) {
      getActiveBandcampTab()
        .then((tab) => {
          if (!tab?.id) {
            sendResponse({ ok: false, error: 'No active Bandcamp tab' });
            return;
          }

          chrome.tabs.update(tab.id, { url: message.url }, () => {
            if (chrome.runtime.lastError) {
              sendResponse({
                ok: false,
                error: chrome.runtime.lastError.message,
              });
              return;
            }

            sendResponse({ ok: true });
          });
        })
        .catch((error) => {
          console.error('Failed to open URL in active tab:', error);
          sendResponse({ ok: false, error: error.message });
        });

      return true;
    }
  },
);

function getCachedPageData(tab: chrome.tabs.Tab): unknown | null {
  if (!tab.id || !tab.url) {
    return null;
  }

  const cached = activeBandcampPageDataByTabId.get(tab.id);
  if (!cached) {
    return null;
  }

  try {
    return new URL(tab.url).hostname === cached.hostname
      ? cached.pageData
      : null;
  } catch {
    return null;
  }
}

function cachePageData(tab: chrome.tabs.Tab, pageData: unknown): void {
  if (!tab.id || !tab.url) {
    return;
  }

  try {
    activeBandcampPageDataByTabId.set(tab.id, {
      hostname: new URL(tab.url).hostname,
      pageData,
    });
  } catch {
    // Ignore cache writes for malformed tab URLs.
  }
}
