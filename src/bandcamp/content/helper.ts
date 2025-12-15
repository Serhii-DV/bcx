import { createQueryCountMap } from 'src/utils/array';
import type { MusicSearchData } from '$lib/components/bcx/types';
import { Band } from '../domain/band/band';

export function createMusicSearchDataFromBand(band: Band): MusicSearchData {
  return {
    artists: band.artistNames,
    bands: [band],
    albums: band.metadata.albums,
    tracks: band.metadata.tracks,
    keywords: band.keywords,
    queryCountMap: createQueryCountMap([]),
  };
}

export function createMusicSearchDataFromBands(bands: Band[]): MusicSearchData {
  const queries: string[] = [];
  const allArtists: string[] = [];
  const allAlbums = bands.flatMap((band) => band.metadata.albums);
  const allTracks = bands.flatMap((band) => band.metadata.tracks);
  const allKeywords: string[] = [];

  // Aggregate all artists from all bands
  bands.forEach((band) => {
    const searchData = createMusicSearchDataFromBand(band);
    allArtists.push(...searchData.artists);
    allKeywords.push(...searchData.keywords);
    queries.push(...band.artistNamesAll);
    queries.push(...band.keywordsAll);
  });

  return {
    artists: allArtists,
    bands: bands,
    albums: allAlbums,
    tracks: allTracks,
    keywords: allKeywords,
    queryCountMap: createQueryCountMap(queries),
  };
}
