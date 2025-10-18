import { currentPageUrl } from 'src/core/shared';
import { getExtensionUrl } from 'src/utils/chrome.runtime';
import { console } from 'src/utils/console';
import { injectCssFile, onDOMReady } from 'src/utils/dom';
import { PageAlbum } from '../domain/page/pageAlbum';
import { BandcampStorage } from '../domain/storage';

onDOMReady(async () => {
  if (!currentPageUrl.isAlbum) {
    return;
  }

  console.log('[app.album]', 'Start content script setup');

  try {
    await injectCssFile(getExtensionUrl('bandcamp.page.album.css'));
    const albumPage = new PageAlbum();
    BandcampStorage.saveAlbum(albumPage.album);
  } catch (error) {
    console.error('[app.album]', 'Failed to setup content script:', error);
  }
});
