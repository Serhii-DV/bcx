import { mount } from 'svelte';
import App from './app.svelte';
import './app.css';
import { getExtensionUrl } from 'src/utils/chrome.runtime';
import { injectCSSFile, onDOMReady } from 'src/utils/dom';
import 'src/utils/console';
import { currentPageUrl } from 'src/core/shared';
import { console } from 'src/utils/console';
import { BandcampStorage } from '../core/storage';

onDOMReady(async () => {
  if (!currentPageUrl.isBandcamp) {
    return;
  }

  console.log('Start all pages content script setup');

  const container = document.createElement('div');
  container.id = 'bcx-app';
  document.body.appendChild(container);

  const shadowRoot = container.attachShadow({ mode: 'open' });

  // Load bands data before mounting the app
  const bands = await BandcampStorage.getBands();

  // Inject content CSS file (see manifest.json for details)
  injectCSSFile(
    getExtensionUrl('bandcamp.content.all.css'),
    () => {
      mount(App, {
        target: shadowRoot,
        props: {
          bands,
        },
      });
    },
    shadowRoot,
  );
});
