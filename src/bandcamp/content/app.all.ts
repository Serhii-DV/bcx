import { mount } from 'svelte';
import App from './app.svelte';
import './app.css';
import { getExtensionUrl } from 'src/utils/chrome.runtime';
import { injectCSSFile, onDOMReady } from 'src/utils/dom';
import 'src/utils/console';
import { currentPageUrl } from 'src/core/shared';

console.log('Bandcamp content app module!');

onDOMReady(() => {
  if (!currentPageUrl.isBandcamp) {
    return;
  }

  const container = document.createElement('div');
  container.id = 'bcx-app';
  document.body.appendChild(container);

  const shadowRoot = container.attachShadow({ mode: 'open' });
  // Inject content CSS file (see manifest.json for details)
  injectCSSFile(
    getExtensionUrl('bandcamp.content.all.css'),
    () => {
      mount(App, {
        target: shadowRoot,
      });
    },
    shadowRoot,
  );
});
