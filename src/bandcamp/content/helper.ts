import { countOccurrences } from 'src/utils/array';
import type {
  AlbumSearchData,
  ArtistSearchData,
  MusicSearchData,
  MusicSearchGroup,
} from '$lib/components/bcx/types';
import type { Band } from '../band';

export function createMusicSearchGroupFromBand(band: Band): MusicSearchGroup {
  const searchGroup: MusicSearchGroup = {
    name: band.name,
    artists: [],
    albums: [],
  };
  const values: string[] = [];

  band.albums.forEach((item) => {
    values.push(...item.artist.names);
  });
  const counts = countOccurrences(values.sort());
  const searchArtists: ArtistSearchData[] = mapToSearchArtists(counts);
  const searchAlbums: AlbumSearchData[] = band.albums
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

  searchGroup.artists = searchArtists;
  searchGroup.albums = searchAlbums;

  return searchGroup;
}

export function createMusicSearchDataFromBand(band: Band): MusicSearchData {
  const searchData: MusicSearchData = [];
  const searchGroup: MusicSearchGroup = createMusicSearchGroupFromBand(band);
  searchData.push(searchGroup);

  return searchData;
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
