import { mount } from 'svelte';
import App from './app.svelte';
import './app.css';
import 'src/utils/console';
import { getExtensionUrl } from 'src/utils/chrome.runtime';
import { injectCSSFile } from 'src/utils/dom';
import { MusicFilter } from '../page/music/filter';

console.log('Bandcamp content module!');

let musicFilter: MusicFilter;

function init() {
  mountApp();

  musicFilter = new MusicFilter();

  window.addEventListener('beforeunload', () => {
    if (musicFilter) {
      musicFilter.destroy();
    }
  });
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Additional safety check for dynamic page loads
if (document.readyState === 'complete') {
  setTimeout(init, 100);
}
