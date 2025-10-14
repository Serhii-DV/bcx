// Types for search results
import type { Album } from 'src/bandcamp/album/album';
import type { Band } from 'src/bandcamp/band/band';
import type { Track } from 'src/bandcamp/track/track';

export interface ArtistSearchData {
  name: string;
  albumCount?: number;
}

export interface MusicSearchData {
  artists: ArtistSearchData[];
  bands: Band[];
  albums: Album[];
  tracks: Track[];
}

export const emptyMusicSearchData: MusicSearchData = {
  artists: [],
  bands: [],
  albums: [],
  tracks: [],
};
