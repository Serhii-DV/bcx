import { countOccurrences } from 'src/utils/array';
import type {
  ArtistSearchData,
  MusicSearchData,
} from '$lib/components/bcx/types';
import { Band } from '../band/band';

export function createMusicSearchDataFromBand(band: Band): MusicSearchData {
  return {
    artists: createArtistSearchData(band),
    bands: [band],
    albums: band.albums,
  };
}

export function createMusicSearchDataFromBands(bands: Band[]): MusicSearchData {
  const allArtists: ArtistSearchData[] = [];
  const allAlbums = bands.flatMap((band) => band.albums);

  // Aggregate all artists from all bands
  bands.forEach((band) => {
    const searchData = createMusicSearchDataFromBand(band);
    allArtists.push(...searchData.artists);
  });

  return {
    artists: allArtists,
    bands: bands,
    albums: allAlbums,
  };
}

/**
 * Creates artist search data from a band by extracting and counting all artist names
 * from the band's albums.
 *
 * @param band - The band to extract artist data from
 * @returns An array of ArtistSearchData with names and album counts
 */
function createArtistSearchData(band: Band): ArtistSearchData[] {
  const albumArtists: string[] = [];

  band.albums.forEach((item) => {
    albumArtists.push(...item.artist.names);
  });

  const counts = countOccurrences(albumArtists.sort());

  return Array.from(counts.entries()).map(([name, count]) => ({
    name: name,
    albumCount: count,
  }));
}
