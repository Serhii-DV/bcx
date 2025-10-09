import { currentPageUrl, storage } from 'src/core/shared';
import { console } from 'src/utils/console';
import { onDOMReady } from 'src/utils/dom';
import { AlbumPage } from '../page/albumPage';

onDOMReady(() => {
  if (!currentPageUrl.isAlbum) {
    return;
  }

  console.log('Start album page content script setup');

  const schema = AlbumPage.findSchema();
  console.log('Schema:', schema);

  if (!schema) {
    return;
  }

  const album = AlbumPage.createAlbumFromSchema(schema);
  console.log('Album extracted from schema:', album);
  storage.set(album).catch((error) => {
    console.error('Failed to store album in storage:', error);
  });
});
