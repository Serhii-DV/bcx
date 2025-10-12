import { currentPageUrl } from 'src/core/shared';
import { onDOMReady } from 'src/utils/dom';
import { mount } from 'svelte';
import { BCXMusicFilter } from '$lib/components/bcx';
import { MusicPage } from '../page/musicPage';
import { BandcampStorage } from '../storage';

onDOMReady(() => {
  if (!currentPageUrl.isMusic) {
    return;
  }

  const musicPage = new MusicPage();
  const band = musicPage.band;
  const musicGrid = musicPage.musicGridElement;

  if (!musicGrid || !band.hasReleases) {
    return;
  }

  BandcampStorage.saveBand(band);

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
});
