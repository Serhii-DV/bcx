import pkg from '../../../package.json';

const BCX = {
  getVersion: () => pkg.version,
  storage: {
    async clearAlbumData(albumId: number) {
      console.log(`[BCX.storage.clearAlbumData] Clearing tracks for album ${albumId}`);
      window.postMessage({
        source: 'BCX',
        action: 'clearAlbumData',
        albumId: albumId
      }, '*');
    },

    async getSize() {
      window.postMessage({
        source: 'BCX',
        action: 'getStorageSize'
      }, '*');
    }
  }
};

console.log('[BCX]', 'BCX script loaded, version:', BCX.getVersion());
(window as any).BCX = BCX;

const logableActionsWithResponse = ['clearAlbumDataResponse', 'getStorageSizeResponse'];

window.addEventListener('message', function(event) {
  if (event.data && event.data.source === 'BCX' && logableActionsWithResponse.includes(event.data.action)) {
    console.log('[BCX][window.addEventListener][response]', event.data.response);
  }
});
