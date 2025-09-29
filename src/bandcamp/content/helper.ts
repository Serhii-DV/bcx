import type { Album } from 'src/bandcamp/album';
import { countOccurrences } from 'src/utils/array';
import type {
  AlbumSearchData,
  ArtistSearchData,
  MusicSearchData,
} from '$lib/components/bcx/types';

export function createMusicSearchDataFromAlbums(
  albums: Album[],
): MusicSearchData {
  const values: string[] = [];

  albums.forEach((item) => {
    values.push(...item.artist.names);
  });
  const counts = countOccurrences(values.sort());
  const searchArtists: ArtistSearchData[] = mapToSearchArtists(counts);
  const searchAlbums: AlbumSearchData[] = albums
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
    artists: searchArtists,
    albums: searchAlbums,
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
 * const searchArtists = mapToSearchArtists(counts);
 * // Result: [
 * //   { name: 'beatles', albumCount: 3 },
 * //   { name: 'queen', albumCount: 2 }
 * // ]
 * ```
 */
function mapToSearchArtists(countMap: Map<string, number>): ArtistSearchData[] {
  return Array.from(countMap.entries()).map(([name, count]) => ({
    name: name,
    albumCount: count,
  }));
}
