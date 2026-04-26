import { mount } from 'svelte';
import App from './app.svelte';
import './app.css';
import { getExtensionUrl } from 'src/utils/chrome.runtime';
import { injectCssFile, injectJSFile, onDOMReady } from 'src/utils/dom';
import 'src/utils/console';
import { BCXEventListener } from 'src/app/bcx/eventListener';
import { bandcampPageData } from 'src/bandcamp/domain/shared';
import { type Message, MessageType } from 'src/core/message';
import { currentPageUrl } from 'src/core/shared';
import { console } from 'src/utils/console';
import { markAppSetupStart, measureAppMount } from 'src/utils/performance';
import { musicFilterStore } from '$lib/stores/musicFilter';
import { PageAlbum } from '../domain/page/pageAlbum';
import { PageMusic } from '../domain/page/pageMusic';
import { PageTrack } from '../domain/page/pageTrack';
import { BandcampStorage } from '../domain/storage';
import {
  isBandcampAlbumUrl,
  isBandcampMusicUrl,
  isBandcampTrackUrl,
  isBandcampUrl,
} from '../domain/url/helper';
import { initAppPageMusic } from './pages/app.pageMusic';

onDOMReady(async () => {
  if (!isBandcampUrl(currentPageUrl)) {
    return;
  }

  console.log('[bandcamp.content.app]', 'Start content script setup');
  const setupStartMark = markAppSetupStart('bandcamp.content.app');

  const container = document.createElement('div');
  container.id = 'bcx-app';
  document.body.appendChild(container);

  const shadowRoot = container.attachShadow({ mode: 'open' });
  injectCssFile(getExtensionUrl('bandcamp.content.app.css'), shadowRoot);

  try {
    if (isBandcampMusicUrl(currentPageUrl)) {
      const pageMusic = await PageMusic.init();
      await initAppPageMusic(pageMusic);
    } else if (isBandcampAlbumUrl(currentPageUrl)) {
      await PageAlbum.init();
    } else if (isBandcampTrackUrl(currentPageUrl)) {
      const trackPage = new PageTrack();
      BandcampStorage.saveTrack(trackPage.track);
    }

    measureAppMount(
      {
        label: 'bandcamp.content.app',
        setupStartMark,
      },
      () =>
        mount(App, {
          target: shadowRoot,
        }),
    );
  } catch (error) {
    console.error(
      '[bandcamp.content.app]',
      'Failed to setup content script:',
      error,
    );
  }
});

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    if (message.type === MessageType.GET_ACTIVE_BANDCAMP_PAGE_DATA) {
      try {
        sendResponse({
          pageData: {
            data: bandcampPageData.data,
            fanData: bandcampPageData.fanData,
          },
        });
      } catch (error) {
        sendResponse({
          pageData: null,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to read Bandcamp page data',
        });
      }

      return;
    }

    if (message.type !== MessageType.APPLY_MUSIC_FILTER_QUERY) {
      return;
    }

    musicFilterStore.setSearchQuery(message.query);
    sendResponse({ ok: true });
  },
);

injectJSFile(getExtensionUrl('bcx.js'), () => {
  console.log('[bcx.js]', 'Injected BCX dev tools script JS file');
  window.addEventListener('message', BCXEventListener);
});
