import { mount } from 'svelte';
import App from './app.svelte';
import './app.css';
import { getExtensionUrl } from 'src/utils/chrome.runtime';
import { injectCssFile, injectJSFile, onDOMReady } from 'src/utils/dom';
import 'src/utils/console';
import { currentPageUrl } from 'src/core/shared';
import { console } from 'src/utils/console';
import { PageMusic } from '../domain/page/pageMusic';
import { BandcampStorage } from '../domain/storage';
import './pages/app.pageMusic';
import './pages/app.pageAlbum';
import './pages/app.pageTrack';
import type { Album } from '../domain/album/album';
import type { Band } from '../domain/band/band';
import { PageAlbum } from '../domain/page/pageAlbum';
import {
  isBandcampAlbumUrl,
  isBandcampMusicUrl,
  isBandcampUrl,
} from '../domain/url/helper';
import { MainTreeData } from 'src/app/treeview/items/MainTreeData';
import { BCXEventListener } from 'src/app/bcx/eventListener';

onDOMReady(async () => {
  if (!isBandcampUrl(currentPageUrl)) {
    return;
  }

  console.log('[bandcamp.content.app]', 'Start content script setup');

  const container = document.createElement('div');
  container.id = 'bcx-app';
  document.body.appendChild(container);

  const shadowRoot = container.attachShadow({ mode: 'open' });

  try {
    await injectCssFile(getExtensionUrl('bandcamp.content.app.css'), shadowRoot);

    let band: Band | null = null;
    let album: Album | null = null;

    if (isBandcampMusicUrl(currentPageUrl)) {
      const pageMusic = await PageMusic.init();
      band = pageMusic.band;
    } else if (isBandcampAlbumUrl(currentPageUrl)) {
      const pageAlbum = await PageAlbum.init();
      const bands = await BandcampStorage.getBands([pageAlbum.album.bandId]);
      band = bands[0];
      album = pageAlbum.album;
    }

    const treeData = await MainTreeData.create(band, album);

    mount(App, {
      target: shadowRoot,
      props: {
        treeData,
      },
    });
  } catch (error) {
    console.error('[bandcamp.content.app]', 'Failed to setup content script:', error);
  }
});

injectJSFile(getExtensionUrl('bcx.js'), () => {
  console.log('[bcx.js]', 'Injected BCX dev tools script JS file');
  window.addEventListener('message', BCXEventListener);
});
