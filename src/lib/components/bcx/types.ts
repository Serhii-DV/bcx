// Types for search results
import type { Album } from 'src/bandcamp/domain/album/album';
import type { Band } from 'src/bandcamp/domain/band/band';
import type { Track } from 'src/bandcamp/domain/track/track';

export interface ValueCountSearchData {
  value: string;
  count: number;
}

export interface ArtistSearchData {
  name: string;
  albumCount?: number;
}

export type QueryCountMap = Map<string, number>;

export interface MusicSearchData {
  artists: string[];
  bands: Band[];
  albums: Album[];
  tracks: Track[];
  keywords: string[];
}

export const emptyMusicSearchData: MusicSearchData = {
  artists: [],
  bands: [],
  albums: [],
  tracks: [],
  keywords: [],
};
