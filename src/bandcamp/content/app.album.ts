import { AlbumPage } from './page/albumPage';

function init() {
  console.log('Page Album Content script initialized');

  if (!window.location.hostname.includes('bandcamp.com')) {
    return;
  }

  const schema = AlbumPage.findSchema();

  if (!schema) {
    return;
  }

  const album = AlbumPage.createAlbumFromSchema(schema);

  console.log('Album extracted from schema:', album);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
