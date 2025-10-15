import { currentPageUrl, storage } from 'src/core/shared';
import { console } from 'src/utils/console';
import { onDOMReady } from 'src/utils/dom';
import { PageAlbum } from '../domain/page/pageAlbum';

onDOMReady(() => {
  if (!currentPageUrl.isAlbum) {
    return;
  }

  console.log('Start album page content script setup');

  try {
    const albumPage = new PageAlbum();
    storage.set(albumPage.album).catch((error) => {
      console.error('Failed to store album in storage:', error);
    });
  } catch (error) {
    console.error('Failed to initialize AlbumPage:', error);
  }
});
