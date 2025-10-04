// Types for search results
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

export interface MusicSearchGroup {
  name: string;
  artists: ArtistSearchData[];
  albums: AlbumSearchData[];
}

export type MusicSearchData = MusicSearchGroup[];
