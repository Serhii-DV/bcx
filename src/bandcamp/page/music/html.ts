import { element, elements } from 'src/utils/dom';
import { removeInvisibleChars, trim } from 'src/utils/string';
import { MusicItem } from './musicItem';

function createMusicItemFromMusicGridItem(gridElement: Element): MusicItem {
  let artist =
    element('.artist-override', gridElement)?.innerText ||
    element('#band-name-location .title')?.innerText ||
    '';

  artist = trim(artist, ' -\n');
  artist = removeInvisibleChars(artist);

  const titleParts = element('.title', gridElement)?.innerText.split('\n') || [
    '',
  ];
  const title = removeInvisibleChars(titleParts[0]);
  const url = element('a', gridElement)?.getAttribute('href') || '';
  const image = element('a .art img', gridElement)?.getAttribute('src') || '';
  const id = gridElement?.getAttribute('data-item-id') || '0';

  return MusicItem.create(
    (url[0] === '/' ? window.location.origin : '') + url,
    artist,
    title,
    image,
    id,
  );
}

export function getMusicItems(): MusicItem[] {
  const items: MusicItem[] = [];

  elements('#music-grid .music-grid-item').forEach((el) => {
    items.push(createMusicItemFromMusicGridItem(el));
  });

  return items;
}
