import { currentPageUrl } from 'src/core/shared';
import { onDOMReady } from 'src/utils/dom';
import { mount } from 'svelte';
import { BCXMusicFilter } from '$lib/components/bcx';
import { MusicPage } from '../page/musicPage';

onDOMReady(() => {
  if (!currentPageUrl.isMusic) {
    return;
  }

  const musicPage = new MusicPage();
  const band = musicPage.band;

  if (band.albums.length === 0) {
    console.log('No albums found on this page');
    return;
  }

  // Create a container for the music filter component
  const musicGrid = document.getElementById('music-grid');
  if (!musicGrid) {
    console.log('Music grid not found on this page');
    return;
  }

  // Create container element for the Svelte component
  const filterContainer = document.createElement('div');
  filterContainer.id = 'bcx-music-filter';

  // Insert the container before the music grid
  if (musicGrid.parentNode) {
    musicGrid.parentNode.insertBefore(filterContainer, musicGrid);
  }

  // Mount the Svelte component using Svelte 5 syntax
  mount(BCXMusicFilter, {
    target: filterContainer,
    props: {
      band,
    },
  });

  console.log(
    `BCX Music Filter component mounted with ${band.albums.length} items`,
  );
});
