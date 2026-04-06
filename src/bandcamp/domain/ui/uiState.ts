import { sessionStorage } from 'src/core/shared';
import { console } from 'src/utils/console';
import { SIDE_PANEL_OPEN_KEY } from '../storageKey';

let initialized = false;
let initPromise: Promise<void> | null = null;
let sidePanelOpenCache: boolean | undefined;
const WINDOW_SESSION_STORAGE_PREFIX = 'bcx';

function windowSessionStorageKey(key: string) {
  return `${WINDOW_SESSION_STORAGE_PREFIX}:${key}`;
}

function canUseExtensionSessionStorage() {
  return (
    typeof chrome !== 'undefined' &&
    Boolean(chrome.runtime?.id) &&
    Boolean(chrome.storage?.session)
  );
}

function readWindowSessionBoolean(key: string): boolean | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    const rawValue = window.sessionStorage.getItem(windowSessionStorageKey(key));
    if (rawValue === null) return undefined;
    return rawValue === 'true';
  } catch (error) {
    console.warn(`❌ BCX: Failed to read window sessionStorage key ${key}:`, error);
    return undefined;
  }
}

async function writeWindowSessionBoolean(
  key: string,
  value: boolean,
): Promise<void> {
  if (typeof window === 'undefined') return;

  window.sessionStorage.setItem(windowSessionStorageKey(key), String(value));
}

export async function getUiSessionBoolean(
  key: string,
): Promise<boolean | undefined> {
  if (canUseExtensionSessionStorage()) {
    try {
      return await sessionStorage.getByKey<boolean>(key);
    } catch (error) {
      console.warn(
        `⚠️ BCX: Falling back to window sessionStorage read for key ${key}:`,
        error,
      );
    }
  }

  return readWindowSessionBoolean(key);
}

export async function setUiSessionBoolean(
  key: string,
  value: boolean,
): Promise<void> {
  if (canUseExtensionSessionStorage()) {
    try {
      await chrome.storage.session.set({ [key]: value });
      return;
    } catch (error) {
      console.warn(
        `⚠️ BCX: Falling back to window sessionStorage write for key ${key}:`,
        error,
      );
    }
  }

  await writeWindowSessionBoolean(key, value);
}

export async function initUiState(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    sidePanelOpenCache = await getUiSessionBoolean(SIDE_PANEL_OPEN_KEY);

    if (canUseExtensionSessionStorage()) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'session') return;

        const change = changes[SIDE_PANEL_OPEN_KEY];
        if (!change) return;

        sidePanelOpenCache = change.newValue as boolean | undefined;
      });
    }

    initialized = true;
  })();

  await initPromise;
}

export function getSidePanelOpen(): boolean | undefined {
  return sidePanelOpenCache;
}

export async function setSidePanelOpen(value: boolean): Promise<void> {
  if (sidePanelOpenCache === value) return;

  sidePanelOpenCache = value;
  await setUiSessionBoolean(SIDE_PANEL_OPEN_KEY, value);
}
