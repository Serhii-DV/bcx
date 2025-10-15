import { currentPageUrl } from 'src/core/shared';
import { console } from 'src/utils/console';
import { onDOMReady } from 'src/utils/dom';
import { mount } from 'svelte';
import { BCXMusicFilter } from '$lib/components/bcx';
import { PageMusic } from '../domain/page/pageMusic';
import { BandcampStorage } from '../domain/storage';

onDOMReady(async () => {
  if (!currentPageUrl.isMusic) {
    return;
  }

  console.log('[app.music]', 'Start album page content script setup');

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
      musicGrid,
      musicGridItems: musicPage.musicGridItemElements,
    },
  });

  BandcampStorage.saveBand(band);
});
