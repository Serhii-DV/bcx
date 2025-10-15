import { currentPageUrl, storage } from 'src/core/shared';
import { console } from 'src/utils/console';
import { onDOMReady } from 'src/utils/dom';
import { PageAlbum } from '../domain/page/pageAlbum';

onDOMReady(() => {
  if (!currentPageUrl.isAlbum) {
    return;
  }

  console.log('[app.album]', 'Start content script setup');

  try {
    const albumPage = new PageAlbum();
    storage.set(albumPage.album).catch((error) => {
      console.error('[app.album]', 'Failed to store album in storage:', error);
    });
  } catch (error) {
    console.error('[app.album]', 'Failed to initialize PageAlbum:', error);
  }
});
