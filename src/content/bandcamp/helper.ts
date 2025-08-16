import type { MusicItem } from 'src/bandcamp/page/music/musicItem';
import { countOccurrences } from 'src/utils/array';
import type { Album, Artist, Data } from '$lib/components/bcx/types';

export function getMusicDataFromMusicItems(musicItems: MusicItem[]): Data {
  const values: string[] = [];

  musicItems.forEach((item) => {
    values.push(...item.artist.names);
  });
  const counts = countOccurrences(values.sort());
  const artists: Artist[] = mapToArtists(counts);
  const albums: Album[] = musicItems
    .map((item) => ({
      url: item.url.toString(),
      artist: item.artist.toString(),
      title: item.title,
    }))
    .sort((a, b) => {
      const aKey = `${a.artist} - ${a.title}`;
      const bKey = `${b.artist} - ${b.title}`;
      return aKey.localeCompare(bKey);
    });

  return {
    artists,
    albums,
  };
}

/**
 * Converts the result from countOccurrences to an array of Artist objects.
 *
 * @param countMap - The Map returned by countOccurrences method
 * @returns An array of Artist objects with name and albumCount
 *
 * @example
 * ```typescript
 * const artists = ['Beatles', 'beatles', 'Queen', 'QUEEN', 'Beatles'];
 * const counts = countOccurrences(artists);
 * const artistObjects = mapToArtists(counts);
 * // Result: [
 * //   { name: 'beatles', albumCount: 3 },
 * //   { name: 'queen', albumCount: 2 }
 * // ]
 * ```
 */
function mapToArtists(countMap: Map<string, number>): Artist[] {
  return Array.from(countMap.entries()).map(([name, count]) => ({
    name: name,
    albumCount: count,
  }));
}
