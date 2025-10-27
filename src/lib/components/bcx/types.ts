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

export interface MusicSearchData {
  artists: ArtistSearchData[];
  bands: Band[];
  albums: Album[];
  tracks: Track[];
  keywords: ValueCountSearchData[];
}

export const emptyMusicSearchData: MusicSearchData = {
  artists: [],
  bands: [],
  albums: [],
  tracks: [],
  keywords: [],
};
