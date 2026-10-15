import { MessageType } from 'src/core/message';
import {
  isMusicLibraryData,
  MUSIC_LIBRARY_REVISION_KEY,
  type MusicLibraryData,
  type MusicLibraryRequest,
} from './musicLibraryProtocol';

export async function requestMusicLibrary(
  request: MusicLibraryRequest,
): Promise<MusicLibraryData> {
  const response: unknown = await chrome.runtime.sendMessage({
    type: MessageType.MUSIC_LIBRARY,
    request,
  });
  if (
    !response ||
    typeof response !== 'object' ||
    !('ok' in response) ||
    response.ok !== true ||
    !('data' in response) ||
    !isMusicLibraryData(response.data)
  ) {
    throw new Error(
      response &&
        typeof response === 'object' &&
        'error' in response &&
        typeof response.error === 'string'
        ? response.error
        : 'Could not access the music library. Reload BCX and retry.',
    );
  }
  return response.data;
}

export function watchMusicLibrary(onChange: () => void): () => void {
  let active = true;
  let revision: string | undefined;
  const update = (next: unknown) => {
    if (!active || typeof next !== 'string' || next === revision) return;
    revision = next;
    onChange();
  };
  const changed = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ) => {
    if (area === 'session')
      update(changes[MUSIC_LIBRARY_REVISION_KEY]?.newValue);
  };
  chrome.storage.onChanged.addListener(changed);
  // The database revision is authoritative, including after worker restarts.
  void requestMusicLibrary({ action: 'revision' }).then(
    (data) => {
      if (revision === undefined) revision = data.revision;
      else update(data.revision);
    },
    (error: unknown) => {
      if (active) console.warn('Could not read music library revision:', error);
    },
  );
  return () => {
    active = false;
    chrome.storage.onChanged.removeListener(changed);
  };
}
