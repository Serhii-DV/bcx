import {
  clearActivityLog,
  recoverActivityLog,
} from 'src/features/bcx/activityLog';
import { updatePinnedNavigation } from 'src/features/bcx/pinnedNavigation';
import { measureStorageActivity } from 'src/features/bcx/storageActivity';
import { captureStorageHistory } from 'src/features/bcx/storageHistory';
import { initializeStorageHistory } from 'src/features/bcx/storageHistoryBackground';
import { console } from 'src/utils/console';
import { getErrorMessage } from 'src/utils/getErrorMessage';
import {
  cancelFanSync,
  FAN_SYNC_PROTOCOL_VERSION,
  isFanSyncTabUrl,
  recoverFanSync,
  startFanSync,
} from './bandcamp/domain/fanData/sync';
import { History } from './core/history';
import { type Message, MessageType } from './core/message';

console.log('Running background script');
void recoverActivityLog();
initializeStorageHistory();
void recoverFanSync().catch(console.error);

const SIDEPANEL_PATH = 'sidepanel.html';
const BANDCAMP_HOST_PATTERN = /(^|\.)bandcamp\.com$/;
const activeBandcampPageDataByTabId = new Map<
  number,
  { hostname: string; pageData: unknown }
>();
const openSidePanelTabIds = new Set<number>();
const sidePanelEnabledByTabId = new Map<number, boolean>();
chrome.tabs.onRemoved.addListener((tabId) => {
  sidePanelEnabledByTabId.delete(tabId);
  openSidePanelTabIds.delete(tabId);
  activeBandcampPageDataByTabId.delete(tabId);
});

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

getSidePanelEvents()?.onOpened?.addListener((info) => {
  if (info.tabId) {
    openSidePanelTabIds.add(info.tabId);
  }
});

getSidePanelEvents()?.onClosed?.addListener((info) => {
  if (info.tabId) {
    openSidePanelTabIds.delete(info.tabId);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === 'complete')
    updateSidePanelOptions(tabId, changeInfo.url ?? tab.url).catch(
      console.error,
    );
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
  if (!chrome.sidePanel || !tabUrl || isFanSyncTabUrl(tabUrl)) return;
  const enabled = true;
  if (sidePanelEnabledByTabId.get(tabId) === enabled) return;
  await chrome.sidePanel.setOptions({ tabId, path: SIDEPANEL_PATH, enabled });
  sidePanelEnabledByTabId.set(tabId, enabled);
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
    if (message.type === MessageType.UPDATE_PINNED_NAVIGATION) {
      updatePinnedNavigation(message.command).then(
        () => sendResponse({ ok: true }),
        (error) =>
          sendResponse({
            ok: false,
            error: getErrorMessage(error, 'Could not save pinned navigation.'),
          }),
      );
      return true;
    }
    if (message.type === MessageType.CLEAR_ACTIVITY_LOG) {
      clearActivityLog().then(
        () => sendResponse({ ok: true }),
        (error) =>
          sendResponse({
            ok: false,
            error: getErrorMessage(error, 'Could not clear activity log.'),
          }),
      );
      return true;
    }
    if (message.type === MessageType.MEASURE_STORAGE) {
      measureStorageActivity().then(
        ({ id, usage }) =>
          sendResponse({
            ok: true,
            id,
            usage: { ...usage, measuredAt: usage.measuredAt.toISOString() },
          }),
        (error) =>
          sendResponse({
            ok: false,
            error: getErrorMessage(error, 'Could not measure storage.'),
          }),
      );
      return true;
    }
    if (message.type === MessageType.CAPTURE_STORAGE_HISTORY) {
      captureStorageHistory(false, 'Manual refresh').then(
        (id) => sendResponse({ ok: true, id }),
        (error) =>
          sendResponse({
            ok: false,
            error: getErrorMessage(error, 'Could not save storage history.'),
          }),
      );
      return true;
    }
    if (message.type === MessageType.GET_FAN_SYNC_VERSION) {
      sendResponse({ protocolVersion: FAN_SYNC_PROTOCOL_VERSION });
      return;
    }
    if (message.type === MessageType.START_FAN_SYNC) {
      startFanSync(message.account, message.action).then(
        () => sendResponse({ ok: true }),
        (error) =>
          sendResponse({
            ok: false,
            error: getErrorMessage(error, 'Could not start sync'),
          }),
      );
      return true;
    }
    if (message.type === MessageType.CANCEL_FAN_SYNC) {
      cancelFanSync();
      sendResponse({ ok: true });
      return;
    }
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

    if (message.type === MessageType.TOGGLE_SIDE_PANEL) {
      toggleSidePanelForMessageSender(_sender, message.tabId)
        .then(() => {
          sendResponse({ ok: true });
        })
        .catch((error) => {
          console.error('Failed to toggle side panel:', error);
          sendResponse({ ok: false, error: error.message });
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
      chrome.tabs
        .query({ active: true, currentWindow: true })
        .then(([tab]) => {
          if (!tab?.id) {
            sendResponse({ ok: false, error: 'No active browser tab' });
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

async function toggleSidePanelForMessageSender(
  sender: chrome.runtime.MessageSender,
  requestedTabId?: number,
): Promise<void> {
  const tab = sender.tab ?? (await getTabById(requestedTabId));
  await toggleSidePanelForTab(tab);
}

async function toggleSidePanelForTab(
  tab: chrome.tabs.Tab | null,
): Promise<void> {
  if (!chrome.sidePanel) {
    throw new Error('Chrome sidePanel API is not available');
  }

  if (!tab?.id) {
    throw new Error('No active browser tab');
  }

  if (openSidePanelTabIds.has(tab.id)) {
    await closeSidePanel(tab.id);
    openSidePanelTabIds.delete(tab.id);
    return;
  }

  enableSidePanel(tab.id).catch(console.error);
  await chrome.sidePanel.open({ tabId: tab.id });
  openSidePanelTabIds.add(tab.id);
}

async function getTabById(tabId?: number): Promise<chrome.tabs.Tab | null> {
  if (!tabId) {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab ?? null;
  }

  try {
    return await chrome.tabs.get(tabId);
  } catch {
    return null;
  }
}

async function closeSidePanel(tabId: number): Promise<void> {
  const sidePanel = chrome.sidePanel as typeof chrome.sidePanel & {
    close?: (options: { tabId: number }) => Promise<void>;
  };

  if (sidePanel.close) {
    await sidePanel.close({ tabId });
    return;
  }

  await chrome.sidePanel.setOptions({
    tabId,
    enabled: false,
  });
  await enableSidePanel(tabId);
}

async function enableSidePanel(tabId: number): Promise<void> {
  await chrome.sidePanel.setOptions({
    tabId,
    path: SIDEPANEL_PATH,
    enabled: true,
  });
}

function getSidePanelEvents(): SidePanelEvents | null {
  return chrome.sidePanel
    ? (chrome.sidePanel as typeof chrome.sidePanel & SidePanelEvents)
    : null;
}

interface SidePanelEvents {
  onOpened?: chrome.events.Event<
    (info: { windowId: number; tabId?: number }) => void
  >;
  onClosed?: chrome.events.Event<
    (info: { windowId: number; tabId?: number }) => void
  >;
}

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
