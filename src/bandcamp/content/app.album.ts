import { Url } from '../url';
import { AlbumPage } from './page/albumPage';

function init() {
  console.log('Page Album Content script initialized');

  const pageUrl = new Url(window.location.href);

  if (!pageUrl.isAlbum) {
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
