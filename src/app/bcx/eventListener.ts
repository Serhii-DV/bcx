import { BandcampStorage } from 'src/bandcamp/domain/storage';
import {
  SIDE_PANEL_TOUR_COMPLETE_KEY,
  TOUR_COMPLETE_KEY,
} from 'src/bandcamp/domain/storageKey';
import { storage } from 'src/core/shared';
import { BCX_LOGGABLE_ACTION_RESPONSE_NAME } from './constants';

type BCXEventData = {
  source: 'BCX';
  action?: string;
  albumId?: number;
};

type BCXActionHandler = (data: BCXEventData) => Promise<void> | void;

const actionHandlers: Record<string, BCXActionHandler> = {
  clearAlbumData,
  getStorageSize,
  resetTour,
  sessionStorageClear,
};

export async function BCXEventListener(event: MessageEvent<unknown>) {
  if (!isBCXEvent(event)) return;

  const { action } = event.data;
  if (!action) return;

  await actionHandlers[action]?.(event.data);
}

function isBCXEvent(
  event: MessageEvent<unknown>,
): event is MessageEvent<BCXEventData> {
  return (
    event.source === window &&
    typeof event.data === 'object' &&
    event.data !== null &&
    'source' in event.data &&
    event.data.source === 'BCX'
  );
}

async function clearAlbumData(data: BCXEventData) {
  const { albumId } = data;
  if (typeof albumId !== 'number') return;

  const albumsRawData = await BandcampStorage.getAlbumsRawDataByIds([albumId]);
  const trackIds = albumsRawData.flatMap((album) => album.trackIds);
  await BandcampStorage.removeTracks(trackIds);

  window.postMessage(
    {
      source: 'BCX',
      action: BCX_LOGGABLE_ACTION_RESPONSE_NAME,
      albumId,
      response: trackIds,
    },
    '*',
  );
}

async function getStorageSize() {
  const count = await storage.count();
  const size = await storage.getSize();

  postLoggableActionResponse({
    count,
    size,
    sizeInBytes: size + ' bytes',
    sizeInKB: (size / 1024).toFixed(2) + ' KB',
    sizeInMB: (size / (1024 * 1024)).toFixed(2) + ' MB',
  });
}

async function resetTour() {
  const tourKeys = [TOUR_COMPLETE_KEY, SIDE_PANEL_TOUR_COMPLETE_KEY];
  await storage.remove(tourKeys);
  postLoggableActionResponse(
    'Tour completion status reset.' +
      tourKeys.join(', ') +
      ' removed from storage.',
  );
}

async function sessionStorageClear() {
  await sessionStorage.clear();
  postLoggableActionResponse('Session storage cleared.');
}

async function postLoggableActionResponse(response: Object | string) {
  window.postMessage(
    {
      source: 'BCX',
      action: BCX_LOGGABLE_ACTION_RESPONSE_NAME,
      response: response,
    },
    '*',
  );
}
