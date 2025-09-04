import 'src/utils/console';
import { mount, unmount } from 'svelte';
import BCXMusicFilter from '$lib/components/bcx/BCXMusicFilter.svelte';
import { getMusicItems } from '../page/music/html';

console.log('Bandcamp content module with Svelte components!');

let musicFilterComponent: any = null;

(() => {
  const musicItems = getMusicItems();

  if (musicItems.length === 0) {
    console.log('No music items found on this page');
    return;
  }

  // injectCSSFile(getExtensionUrl('bandcamp.content.css'), () => {
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
  musicFilterComponent = mount(BCXMusicFilter, {
    target: filterContainer,
    props: {
      musicItems: musicItems,
    },
  });

  console.log(
    `BCX Music Filter component mounted with ${musicItems.length} items`,
  );
  // });
})();

window.addEventListener('beforeunload', () => {
  if (musicFilterComponent) {
    unmount(musicFilterComponent);
    musicFilterComponent = null;
  }
});
