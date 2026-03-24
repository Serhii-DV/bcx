import { getArtistNamesFromTracks } from '../track/helper';
import type { Album } from './album';

/**
 * Get all artist names associated with the band's releases, including duplicates.
 */
export function getArtistNamesFromAlbums(albums: Album[]): string[] {
  const artistNames: string[] = [];

  albums.forEach((album: Album) => {
    artistNames.push(...album.artist.names);

    if (album.artist.isVariousArtists) {
      artistNames.push(album.artist.toString());
    }
  });

  artistNames.push(
    ...getArtistNamesFromTracks(albums.flatMap((album) => album.tracks)),
  );

  return artistNames;
}
