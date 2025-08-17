import 'src/utils/console';
import { getExtensionUrl } from 'src/utils/chrome.runtime';
import { injectCSSFile } from 'src/utils/dom';
import { MusicFilter } from '../page/music/filter';
import { getMusicItems } from '../page/music/html';

console.log('Bandcamp content module!');

let musicFilter: MusicFilter;

(() => {
  const musicItems = getMusicItems();
  injectCSSFile(getExtensionUrl('bandcamp.content.css'), () => {
    musicFilter = new MusicFilter(musicItems);
  });
})();

window.addEventListener('beforeunload', () => {
  if (musicFilter) {
    musicFilter.destroy();
  }
});
