// Types for search results
import type { Album } from 'src/bandcamp/album';
import type { Band } from 'src/bandcamp/band';

export interface ArtistSearchData {
  name: string;
  albumCount?: number;
}

export interface MusicSearchData {
  artists: ArtistSearchData[];
  bands: Band[];
  albums: Album[];
}

export const emptyMusicSearchData: MusicSearchData = {
  artists: [],
  bands: [],
  albums: [],
};
