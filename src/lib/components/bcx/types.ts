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
