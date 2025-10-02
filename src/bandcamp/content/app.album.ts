import { currentPageUrl, storage } from 'src/core/shared';
import { AlbumPage } from '../page/albumPage';

function init() {
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
  storage.save(album).catch((error) => {
    console.error('Failed to store album in storage:', error);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
