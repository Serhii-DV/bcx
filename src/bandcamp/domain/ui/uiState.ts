import { sessionStorage } from 'src/core/shared';
import { SIDE_PANEL_OPEN_KEY } from '../storageKey';

let initialized = false;
let initPromise: Promise<void> | null = null;
let sidePanelOpenCache: boolean | undefined;

export async function initUiState(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    sidePanelOpenCache =
      await sessionStorage.getByKey<boolean>(SIDE_PANEL_OPEN_KEY);

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'session') return;

      const change = changes[SIDE_PANEL_OPEN_KEY];
      if (!change) return;

      sidePanelOpenCache = change.newValue as boolean | undefined;
    });

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
  await chrome.storage.session.set({ [SIDE_PANEL_OPEN_KEY]: value });
}
