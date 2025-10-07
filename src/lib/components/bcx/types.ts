// Types for search results
import type { Album } from 'src/bandcamp/album';
import type { Band } from 'src/bandcamp/band';

export interface ArtistSearchData {
  name: string;
  albumCount?: number;
}

export interface AlbumSearchData {
  url: string;
  artist: string;
  title: string;
  year?: number;
}

export interface MusicSearchData {
  bands: Band[];
  albums: Album[];
}

export const emptyMusicSearchData: MusicSearchData = {
  bands: [],
  albums: [],
};
