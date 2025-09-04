// Types for search results
export interface Artist {
  name: string;
  albumCount?: number;
}

export interface Album {
  url: string;
  artist: string;
  title: string;
  year?: number;
}

export interface Data {
  artists: Artist[];
  albums: Album[];
}

// Music filter types
export interface MusicFilterProps {
  musicItems: import('src/bandcamp/page/music/musicItem').MusicItem[];
}

// Re-export MusicItem for convenience
export type { MusicItem } from 'src/bandcamp/page/music/musicItem';
