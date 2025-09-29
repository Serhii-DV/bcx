import { AlbumPage } from './page/albumPage';

function init() {
  console.log('Page Album Content script initialized');

  if (!window.location.hostname.includes('bandcamp.com')) {
    return;
  }

  // Extract schema from LD+JSON script tag
  const schemaScript = document.querySelector(
    'script[type="application/ld+json"]',
  );
  if (!schemaScript) {
    console.warn('No LD+JSON schema found on page');
    return;
  }

  try {
    const schema = JSON.parse(schemaScript.textContent || '');
    const album = AlbumPage.createAlbumFromSchema(schema);

    console.log('Album extracted from schema:', album);
  } catch (error) {
    console.error('Failed to parse LD+JSON schema:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
