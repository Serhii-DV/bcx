import { currentPageUrl, storage } from 'src/core/shared';
import { onDOMReady } from 'src/utils/dom';
import { AlbumPage } from '../page/albumPage';

onDOMReady(() => {
  console.log('Page Album Content script initialized');

  if (!currentPageUrl.isAlbum) {
    return;
  }

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
