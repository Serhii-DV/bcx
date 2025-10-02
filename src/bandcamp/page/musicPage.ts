import { element, elements } from 'src/utils/dom';
import { removeInvisibleChars, trim } from 'src/utils/string';
import { Album } from '../album';

export class MusicPage {
  /**
   * Creates an Album object from a music grid item element
   * @param gridElement The DOM element representing a music grid item
   * @returns Album object created from the grid element
   */
  static createAlbumFromMusicGridItem(gridElement: Element): Album {
    let artist =
      element('.artist-override', gridElement)?.innerText ||
      element('#band-name-location .title')?.innerText ||
      '';

    artist = trim(artist, ' -\n');
    artist = removeInvisibleChars(artist);

    const titleParts = element('.title', gridElement)?.innerText.split(
      '\n',
    ) || [''];
    const title = removeInvisibleChars(titleParts[0]);
    const url = element('a', gridElement)?.getAttribute('href') || '';
    const image = element('a .art img', gridElement)?.getAttribute('src') || '';
    const id = gridElement?.getAttribute('data-item-id') || '0';
    const sellingBandId = gridElement?.getAttribute('data-band-id') || '0';

    return Album.create(
      (url[0] === '/' ? window.location.origin : '') + url,
      artist,
      title,
      image,
      id,
      sellingBandId,
    );
  }

  /**
   * Finds and extracts all albums from the music grid on the current page
   * @returns Array of Album objects found on the page
   */
  static findAlbums(): Album[] {
    const items: Album[] = [];

    elements('#music-grid .music-grid-item').forEach((el) => {
      items.push(this.createAlbumFromMusicGridItem(el));
    });

    return items;
  }
}
