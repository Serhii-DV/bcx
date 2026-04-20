import { BandcampStorage } from 'src/bandcamp/domain/storage';
import { BandIndexData } from 'src/bandcamp/domain/storage/bandIndexData';
import {
  SIDE_PANEL_TOUR_COMPLETE_KEY,
  StorageKey,
  TOUR_COMPLETE_KEY,
} from 'src/bandcamp/domain/storageKey';
import { storage } from 'src/core/shared';

type BCXEventData = {
  source: 'BCX';
  action?: string;
  albumId?: number;
};

type BCXActionHandler = (data: BCXEventData) => Promise<void> | void;

const actionHandlers: Record<string, BCXActionHandler> = {
  clearAlbumData,
  getStorageSize,
  indexBands,
  resetTour,
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
  const trackKeys = albumsRawData.flatMap((albumRawData) =>
    StorageKey.trackKeys(albumRawData.trackIds),
  );

  await storage.remove(trackKeys);

  window.postMessage(
    {
      source: 'BCX',
      action: 'clearAlbumDataResponse',
      albumId,
      response: trackKeys,
    },
    '*',
  );
}

async function getStorageSize() {
  const count = await storage.count();
  const size = await storage.getSize();

  window.postMessage(
    {
      source: 'BCX',
      action: 'getStorageSizeResponse',
      response: {
        count,
        size,
        sizeInBytes: size + ' bytes',
        sizeInKB: (size / 1024).toFixed(2) + ' KB',
        sizeInMB: (size / (1024 * 1024)).toFixed(2) + ' MB',
      },
    },
    '*',
  );
}

async function indexBands() {
  const bandIndexData = await BandIndexData.refresh();

  window.postMessage(
    {
      source: 'BCX',
      action: 'indexBandsResponse',
      response: Object.keys(bandIndexData).length + ' bands indexed',
    },
    '*',
  );
}

async function resetTour() {
  const tourKeys = [TOUR_COMPLETE_KEY, SIDE_PANEL_TOUR_COMPLETE_KEY];
  await storage.remove(tourKeys);

  window.postMessage(
    {
      source: 'BCX',
      action: 'resetTourResponse',
      response:
        'Tour completion status reset.' +
        tourKeys.join(', ') +
        ' removed from storage.',
    },
    '*',
  );
}
