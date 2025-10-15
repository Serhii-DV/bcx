import { currentPageUrl } from 'src/core/shared';
import { console } from 'src/utils/console';
import { onDOMReady } from 'src/utils/dom';
import { PageAlbum } from '../domain/page/pageAlbum';
import { BandcampStorage } from '../domain/storage';

onDOMReady(() => {
  if (!currentPageUrl.isAlbum) {
    return;
  }

  console.log('[app.album]', 'Start content script setup');

  try {
    const albumPage = new PageAlbum();
    BandcampStorage.saveAlbum(albumPage.album);
  } catch (error) {
    console.error('[app.album]', 'Failed to initialize PageAlbum:', error);
  }
});
