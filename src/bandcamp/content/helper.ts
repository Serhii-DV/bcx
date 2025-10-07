import { storage } from 'src/core/shared';
import { countOccurrences } from 'src/utils/array';
import type {
  AlbumSearchData,
  ArtistSearchData,
  MusicSearchData,
} from '$lib/components/bcx/types';
import { Band } from '../band';

export function createMusicSearchDataFromBand(band: Band): MusicSearchData {
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

  return {
    artists: searchArtists,
    albums: searchAlbums,
  };
}

export function createMusicSearchDataFromBands(bands: Band[]): MusicSearchData {
  const allArtists: ArtistSearchData[] = [];
  const allAlbums: AlbumSearchData[] = [];

  // Aggregate all artists and albums from all bands
  bands.forEach((band) => {
    const searchData = createMusicSearchDataFromBand(band);
    allArtists.push(...searchData.artists);
    allAlbums.push(...searchData.albums);
  });

  return {
    artists: allArtists,
    albums: allAlbums,
  };
}

export async function getBandsFromStorage(): Promise<Band[]> {
  // TODO: For better performance, consider maintaining a 'band.ids' index
  // to avoid loading all storage data. Currently using getAll() for simplicity.
  const allData = await storage.getAll();
  const bands: Band[] = [];

  for (const [key, value] of Object.entries(allData)) {
    if (key.startsWith('band.') && key !== 'band.ids') {
      const band = Band.fromStorageObject(value);
      bands.push(band);
    }
  }

  return bands;
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
