import pkg from '../../../package.json';
import { BCX_LOGGABLE_ACTION_RESPONSE_NAME } from './constants';

const BCX = {
  get version() {
    return pkg.version;
  },
  tour: {
    reset() {
      window.postMessage(
        {
          source: 'BCX',
          action: 'resetTour',
        },
        '*',
      );
    },
  },
  storage: {
    async clearAlbumData(albumId: number) {
      console.log(
        `[BCX.storage.clearAlbumData] Clearing tracks for album ${albumId}`,
      );
      window.postMessage(
        {
          source: 'BCX',
          action: 'clearAlbumData',
          albumId: albumId,
        },
        '*',
      );
    },

    async getSize() {
      window.postMessage(
        {
          source: 'BCX',
          action: 'getStorageSize',
        },
        '*',
      );
    },

    async indexBands() {
      window.postMessage(
        {
          source: 'BCX',
          action: 'indexBands',
        },
        '*',
      );
    },
  },
  sessionStorage: {
    async clear() {
      window.postMessage(
        {
          source: 'BCX',
          action: 'sessionStorageClear',
        },
        '*',
      );
    },
  },
};

console.log('[BCX]', 'BCX script loaded, version:', BCX.version);
(window as any).BCX = BCX;

window.addEventListener('message', function (event) {
  if (
    event.data &&
    event.data.source === 'BCX' &&
    event.data.action === BCX_LOGGABLE_ACTION_RESPONSE_NAME
  ) {
    console.log(
      '[BCX][window.addEventListener][response]',
      event.data.response,
    );
  }
});
