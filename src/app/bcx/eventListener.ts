import { BandcampStorage } from "src/bandcamp/domain/storage";
import { StorageKey } from "src/bandcamp/domain/storageKey";
import { storage } from "src/core/shared";

export function BCXEventListener(event: MessageEvent<any>) {
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
  }
}