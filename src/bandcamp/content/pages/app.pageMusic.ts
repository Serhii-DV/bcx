import { console } from 'src/utils/console';
import { mount } from 'svelte';
import { BCXMusicFilter } from '$lib/components/bcx';
import type { PageMusic } from '../../domain/page/pageMusic';
import { BandcampStorage } from '../../domain/storage';

export async function initAppPageMusic(pageMusic: PageMusic): Promise<void> {
  console.log('[app.pageMusic]', 'Start content script setup');

  const band = pageMusic.band;
  const musicGrid = pageMusic.musicGridElement;

  if (!musicGrid || !band.hasReleases) {
    throw new Error('[PageMusic] Cannot detect releases');
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
      queryCountMap: pageMusic.queryCountMap,
      musicGrid,
      musicGridItems: pageMusic.musicGridItemElements,
    },
  });

  await BandcampStorage.saveBand(band);
}
