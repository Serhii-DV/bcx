import { currentPageUrl } from 'src/core/shared';
import { console } from 'src/utils/console';
import { onDOMReady } from 'src/utils/dom';
import { mount } from 'svelte';
import { BCXMusicFilter } from '$lib/components/bcx';
import { PageMusic } from '../domain/page/pageMusic';
import { BandcampStorage } from '../domain/storage';
import { isBandcampMusicUrl } from '../domain/url/helper';

onDOMReady(async () => {
  if (!isBandcampMusicUrl(currentPageUrl)) {
    return;
  }

  console.log('[app.music]', 'Start content script setup');

  try {
    const musicPage = await PageMusic.init();
    const band = musicPage.band;
    const musicGrid = musicPage.musicGridElement;

    if (!musicGrid || !band.hasReleases) {
      return;
    }
    const filterContainer = document.createElement('div');
    filterContainer.id = 'bcx-music-filter';

    // Insert the container before the music grid
    if (musicGrid.parentNode) {
      musicGrid.parentNode.insertBefore(filterContainer, musicGrid);
    }

    mount(BCXMusicFilter, {
      target: filterContainer,
      props: {
        band,
        queryCountMap: musicPage.queryCountMap,
        musicGrid,
        musicGridItems: musicPage.musicGridItemElements,
      },
    });

    await BandcampStorage.saveBand(band);
  } catch (error) {
    console.error('[app.music]', 'Failed to setup content script:', error);
  }
});
