import { mount } from 'svelte';
import App from './app.svelte';
import './app.css';
import { getExtensionUrl } from 'src/utils/chrome.runtime';
import { injectCSSFile } from 'src/utils/dom';
import 'src/utils/console';
import BCXMusicFilter from '$lib/components/bcx/BCXMusicFilter.svelte';
import { findAlbumsOnThePage } from './page/musicPage';

console.log('Bandcamp content app module!');

function init() {
  mountApp();
  mountMusicFilter();
}

function mountApp() {
  if (!window.location.hostname.includes('bandcamp.com')) {
    return;
  }

  const container = document.createElement('div');
  container.id = 'bcx-app';
  document.body.appendChild(container);

  const shadowRoot = container.attachShadow({ mode: 'open' });
  // Inject content CSS file (see manifest.json for details)
  injectCSSFile(
    getExtensionUrl('bandcamp.content.css'),
    () => {
      mount(App, {
        target: shadowRoot,
      });
    },
    shadowRoot,
  );
}

function mountMusicFilter() {
  if (!window.location.hostname.includes('bandcamp.com')) {
    return;
  }

  const albums = findAlbumsOnThePage();

  if (albums.length === 0) {
    console.log('No albums found on this page');
    return;
  }

  // Create a container for the music filter component
  const musicGrid = document.getElementById('music-grid');
  if (!musicGrid) {
    console.log('Music grid not found on this page');
    return;
  }

  // Create container element for the Svelte component
  const filterContainer = document.createElement('div');
  filterContainer.id = 'bcx-music-filter';

  // Insert the container before the music grid
  if (musicGrid.parentNode) {
    musicGrid.parentNode.insertBefore(filterContainer, musicGrid);
  }

  // Mount the Svelte component using Svelte 5 syntax
  mount(BCXMusicFilter, {
    target: filterContainer,
    props: {
      albums,
    },
  });

  console.log(`BCX Music Filter component mounted with ${albums.length} items`);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Additional safety check for dynamic page loads
if (document.readyState === 'complete') {
  setTimeout(init, 100);
}
