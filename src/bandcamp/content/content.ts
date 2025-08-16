import 'src/utils/console';
import { getExtensionUrl } from 'src/utils/chrome.runtime';
import { injectCSSFile } from 'src/utils/dom';
import { MusicFilter } from '../page/music/filter';

console.log('Bandcamp content module!');

let musicFilter: MusicFilter;

(() => {
  injectCSSFile(getExtensionUrl('bandcamp.content.css'), () => {
    musicFilter = new MusicFilter();
  });
})();

window.addEventListener('beforeunload', () => {
  if (musicFilter) {
    musicFilter.destroy();
  }
});
