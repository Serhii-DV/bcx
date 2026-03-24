import { BandcampStorage } from "src/bandcamp/domain/storage";
import { StorageKey } from "src/bandcamp/domain/storageKey";
import { storage } from "src/core/shared";

export async function BCXEventListener(event: MessageEvent<any>) {
  if (event.source !== window || !event.data || event.data.source !== 'BCX') return;

  if (event.data.action === 'clearAlbumData') {
    const albumId = event.data.albumId;
    BandcampStorage.getAlbumsRawDataByIds([albumId]).then((albumsRawData) => {
      const trackKeys = albumsRawData.flatMap(albumRawData => StorageKey.trackKeys(albumRawData.trackIds));
      storage.remove(trackKeys).then(() => {
        const response = trackKeys;
        window.postMessage({
          source: 'BCX',
          action: 'clearAlbumDataResponse',
          albumId,
          response
        }, '*');
      });

    });
  } else if (event.data.action === 'getStorageSize') {
    const count = await storage.count();
    const size = await storage.getSize();

    window.postMessage({
      source: 'BCX',
      action: 'getStorageSizeResponse',
      response: {
        count,
        size,
        sizeInBytes: size + ' bytes',
        sizeInKB: (size / 1024).toFixed(2) + ' KB',
        sizeInMB: (size / (1024 * 1024)).toFixed(2) + ' MB',
      }
    }, '*');
  }
}
