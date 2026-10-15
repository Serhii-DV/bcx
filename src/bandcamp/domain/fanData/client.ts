import { MessageType } from 'src/core/message';
import {
  FAN_LIBRARY_REVISION_KEY,
  type FanLibraryChange,
  type FanLibraryRequest,
  type FanLibraryResponse,
  isFanLibraryChange,
  isFanLibraryResponse,
} from './protocol';

export async function requestFanLibrary(
  request: FanLibraryRequest,
): Promise<FanLibraryResponse> {
  const response: unknown = await chrome.runtime.sendMessage({
    type: MessageType.FAN_LIBRARY,
    request,
  });
  if (
    !response ||
    typeof response !== 'object' ||
    !('ok' in response) ||
    response.ok !== true ||
    !('data' in response) ||
    !isFanLibraryResponse(response.data)
  ) {
    throw new Error(
      response &&
        typeof response === 'object' &&
        'error' in response &&
        typeof response.error === 'string'
        ? response.error
        : 'Could not access saved fan data. Reload BCX and retry.',
    );
  }
  return response.data;
}

export function watchFanLibrary(
  onChange: (change?: FanLibraryChange) => void,
): () => void {
  let active = true;
  let revision: string | undefined;
  const changed = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ) => {
    if (area !== 'session') return;
    const value = changes[FAN_LIBRARY_REVISION_KEY]?.newValue;
    if (!isFanLibraryChange(value) || value.revision === revision) return;
    revision = value.revision;
    onChange(value);
  };
  chrome.storage.onChanged.addListener(changed);
  void requestFanLibrary({ action: 'revision' }).then(
    (data) => {
      if (!active) return;
      if (revision === undefined) revision = data.revision;
      else if (revision !== data.revision) {
        revision = data.revision;
        onChange();
      }
    },
    (error: unknown) => {
      if (active) console.warn('Could not read fan library revision:', error);
    },
  );
  return () => {
    active = false;
    chrome.storage.onChanged.removeListener(changed);
  };
}
