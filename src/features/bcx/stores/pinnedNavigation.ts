import { MessageType } from 'src/core/message';
import { getErrorMessage } from 'src/utils/getErrorMessage';
import { readable } from 'svelte/store';
import {
  PINNED_NAVIGATION_KEY,
  type PinCommand,
  type PinnedNavigation,
  readPinnedNavigation,
} from '../pinnedNavigation';

interface PinsState extends PinnedNavigation {
  loading: boolean;
  error: string;
}

let reload: (() => Promise<void>) | undefined;
export const pinnedNavigation = readable<PinsState>(
  { version: 1, items: [], loading: true, error: '' },
  (set) => {
    let generation = 0;
    let state: PinsState = { version: 1, items: [], loading: true, error: '' };
    const refresh = async () => {
      const request = ++generation;
      try {
        const document = await readPinnedNavigation();
        if (request !== generation) return;
        state = { ...document, loading: false, error: '' };
      } catch (error) {
        if (request !== generation) return;
        state = {
          ...state,
          loading: false,
          error: getErrorMessage(error, 'Could not load pinned navigation.'),
        };
      }
      set(state);
    };
    const changed = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area === 'local' && PINNED_NAVIGATION_KEY in changes) void refresh();
    };
    reload = refresh;
    chrome.storage.onChanged.addListener(changed);
    void refresh();
    return () => {
      generation++;
      reload = undefined;
      chrome.storage.onChanged.removeListener(changed);
    };
  },
);

export async function refreshPinnedNavigation(): Promise<void> {
  await reload?.();
}

export async function changePin(command: PinCommand): Promise<void> {
  const response: unknown = await chrome.runtime.sendMessage({
    type: MessageType.UPDATE_PINNED_NAVIGATION,
    command,
  });
  if (
    !response ||
    typeof response !== 'object' ||
    !('ok' in response) ||
    response.ok !== true
  ) {
    const error =
      response &&
      typeof response === 'object' &&
      'error' in response &&
      typeof response.error === 'string'
        ? response.error
        : 'Could not save pinned navigation. Please try again.';
    throw new Error(error);
  }
  await refreshPinnedNavigation();
}
