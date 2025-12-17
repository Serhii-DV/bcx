import { console } from 'src/utils/console';
import type { MusicSearchData } from '$lib/components/bcx/types';
import type { Album } from '../domain/album/album';
import { Band } from '../domain/band/band';
import type { Track } from '../domain/track/track';

export function createMusicSearchDataFromBand(band: Band): MusicSearchData {
  console.log('[createMusicSearchDataFromBand] band:', band);
  return {
    artists: band.metadata.artistNames,
    bands: [band],
    albums: band.metadata.albums,
    tracks: band.metadata.trackReleases,
    keywords: band.metadata.keywords,
    queries: band.metadata.queries,
  };
}

export function createMusicSearchDataFromBands(bands: Band[]): MusicSearchData {
  const artists: string[] = bands.flatMap((band) => band.metadata.artistNames);
  const albums: Album[] = bands.flatMap((band) => band.metadata.albums);
  const tracks: Track[] = bands.flatMap((band) => band.metadata.trackReleases);
  const keywords: string[] = bands.flatMap((band) => band.metadata.keywords);
  const queries: string[] = bands.flatMap((band) => band.metadata.queries);

  // Aggregate all artists from all bands
  bands.forEach((band) => {
    artists.push(...band.metadata.artistNames);
    keywords.push(...band.metadata.keywords);
    queries.push(...band.metadata.queries);
  });

  return {
    artists,
    bands,
    albums,
    tracks,
    keywords,
    queries,
  };
}
