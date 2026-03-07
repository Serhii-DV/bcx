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
  }
};

console.log('[BCX]', 'BCX script loaded, version:', BCX.getVersion());
(window as any).BCX = BCX;

window.addEventListener('message', function(event) {
  if (event.data && event.data.source === 'BCX' && event.data.action === 'clearAlbumDataResponse') {
    console.log('[BCX][window.addEventListener]', event.data);
  }
});
