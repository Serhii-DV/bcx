import { mount } from 'svelte';
import App from './app.svelte';
import './app.css';
import { getExtensionUrl } from 'src/utils/chrome.runtime';
import { injectCssFile, injectJSFile, onDOMReady } from 'src/utils/dom';
import 'src/utils/console';
import { BCXEventListener } from 'src/app/bcx/eventListener';
import { MainTreeData } from 'src/app/treeview/items/MainTreeData';
import { currentPageUrl, storage } from 'src/core/shared';
import { console } from 'src/utils/console';
import { markAppSetupStart, measureAppMount } from 'src/utils/performance';
import type { Album } from '../domain/album/album';
import type { Band } from '../domain/band/band';
import { PageAlbum } from '../domain/page/pageAlbum';
import { PageMusic } from '../domain/page/pageMusic';
import { PageTrack } from '../domain/page/pageTrack';
import { BandcampStorage } from '../domain/storage';
import {
  SIDE_PANEL_OPEN_KEY,
  SIDE_PANEL_TOUR_COMPLETE_KEY,
  TOUR_COMPLETE_KEY,
} from '../domain/storageKey';
import { getSessionBoolean } from '../domain/ui/uiState';
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

  let band: Band | null = null;
  let album: Album | null = null;

  try {
    if (isBandcampMusicUrl(currentPageUrl)) {
      const pageMusic = await PageMusic.init();
      await initAppPageMusic(pageMusic);
      band = pageMusic.band;
    } else if (isBandcampAlbumUrl(currentPageUrl)) {
      const pageAlbum = await PageAlbum.init();
      band = pageAlbum.band;
      album = pageAlbum.album;
    } else if (isBandcampTrackUrl(currentPageUrl)) {
      const trackPage = new PageTrack();
      BandcampStorage.saveTrack(trackPage.track);
    }

    const treeData = await MainTreeData.create(currentPageUrl, band, album);
    const [initialSidePanelOpen, hasCompletedTour, hasCompletedSidePanelTour] =
      await Promise.all([
        getSessionBoolean(SIDE_PANEL_OPEN_KEY),
        storage.getBooleanByKey(TOUR_COMPLETE_KEY),
        storage.getBooleanByKey(SIDE_PANEL_TOUR_COMPLETE_KEY),
      ]);

    measureAppMount(
      {
        label: 'bandcamp.content.app',
        setupStartMark,
      },
      () =>
        mount(App, {
          target: shadowRoot,
          props: {
            treeData,
            initialSidePanelOpen,
            hasCompletedTour: hasCompletedTour ?? false,
            hasCompletedSidePanelTour: hasCompletedSidePanelTour ?? false,
          },
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

injectJSFile(getExtensionUrl('bcx.js'), () => {
  console.log('[bcx.js]', 'Injected BCX dev tools script JS file');
  window.addEventListener('message', BCXEventListener);
});
