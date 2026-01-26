import type { MusicSearchData } from '$lib/components/bcx/types';
import type { Album } from '../domain/album/album';
import { Band } from '../domain/band/band';
import type { Track } from '../domain/track/track';

export function createMusicSearchDataFromBands(bands: Band[]): MusicSearchData {
  const artists: string[] = bands.flatMap((band) => band.metadata.artistNames);
  const albums: Album[] = bands.flatMap((band) => band.metadata.albums);
  const tracks: Track[] = bands.flatMap((band) => band.metadata.trackReleases);
  const keywords: string[] = bands.flatMap((band) => band.metadata.keywords);

  return {
    artists,
    bands,
    albums,
    tracks,
    keywords,
  };
}
