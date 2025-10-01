import { Storage } from 'src/core/storage';
import { AlbumPage } from '../page/albumPage';
import { Url } from '../url';

function init() {
  console.log('Page Album Content script initialized');

  const pageUrl = new Url(window.location.href);

  if (!pageUrl.isAlbum) {
    return;
  }

  const schema = AlbumPage.findSchema();
  console.log('Schema:', schema);

  if (!schema) {
    return;
  }

  const album = AlbumPage.createAlbumFromSchema(schema);
  console.log('Album extracted from schema:', album);

  const storage = new Storage();
  storage.save(album).catch((error) => {
    console.error('Failed to store album in storage:', error);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
