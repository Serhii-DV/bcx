import { currentPageUrl } from 'src/core/shared';
import { console } from 'src/utils/console';
import { onDOMReady } from 'src/utils/dom';
import { PageAlbum } from '../../domain/page/pageAlbum';
import { BandcampStorage } from '../../domain/storage';
import { isBandcampAlbumUrl } from '../../domain/url/helper';

onDOMReady(async () => {
  if (!isBandcampAlbumUrl(currentPageUrl)) {
    return;
  }

  console.log('[app.album]', 'Start content script setup');

  try {
    const albumPage = await PageAlbum.init();
    await BandcampStorage.saveAlbum(albumPage.album);
  } catch (error) {
    console.error('[app.album]', 'Failed to setup content script:', error);
  }
});
