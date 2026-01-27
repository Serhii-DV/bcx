import { mount } from 'svelte';
import App from './app.all.svelte';
import './app.all.css';
import { getExtensionUrl } from 'src/utils/chrome.runtime';
import { injectCssFile, onDOMReady } from 'src/utils/dom';
import 'src/utils/console';
import { currentPageUrl } from 'src/core/shared';
import { arrayPreview, console } from 'src/utils/console';
import { PageMusic } from '../domain/page/page.music';
import { BandcampStorage } from '../domain/storage';

onDOMReady(async () => {
  if (!currentPageUrl.isBandcamp) {
    return;
  }

  console.log('[app.all]', 'Start content script setup');

  const container = document.createElement('div');
  container.id = 'bcx-app';
  document.body.appendChild(container);

  const shadowRoot = container.attachShadow({ mode: 'open' });

  try {
    await injectCssFile(getExtensionUrl('bandcamp.page.all.css'), shadowRoot);

    // Load bands data before mounting the app
    const bands = await BandcampStorage.getBands();
    console.log(
      '[app.all]',
      `Loaded ${bands.length} bands from storage`,
      ...arrayPreview(bands),
    );

    let pageMusic = undefined;

    if (currentPageUrl.isMusic) {
      pageMusic = await PageMusic.init();
    }

    mount(App, {
      target: shadowRoot,
      props: {
        bands,
        pageMusic,
      },
    });
  } catch (error) {
    console.error('[app.all]', 'Failed to setup content script:', error);
  }
});
