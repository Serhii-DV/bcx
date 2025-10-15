import { countOccurrences } from 'src/utils/array';
import type {
  ArtistSearchData,
  MusicSearchData,
} from '$lib/components/bcx/types';
import { Band } from '../domain/band/band';

export function createMusicSearchDataFromBand(band: Band): MusicSearchData {
  return {
    artists: createArtistSearchData(band),
    bands: [band],
    albums: band.metadata.albums,
    tracks: band.metadata.tracks,
  };
}

export function createMusicSearchDataFromBands(bands: Band[]): MusicSearchData {
  const allArtists: ArtistSearchData[] = [];
  const allAlbums = bands.flatMap((band) => band.metadata.albums);
  const allTracks = bands.flatMap((band) => band.metadata.tracks);

  // Aggregate all artists from all bands
  bands.forEach((band) => {
    const searchData = createMusicSearchDataFromBand(band);
    allArtists.push(...searchData.artists);
  });

  return {
    artists: allArtists,
    bands: bands,
    albums: allAlbums,
    tracks: allTracks,
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

  band.metadata.albums.forEach((album) => {
    albumArtists.push(...album.artist.names);
  });

  band.metadata.tracks.forEach((track) => {
    albumArtists.push(...track.artist.names);
  });

  const counts = countOccurrences(albumArtists.sort());

  return Array.from(counts.entries()).map(([name, count]) => ({
    name: name,
    albumCount: count,
  }));
}
