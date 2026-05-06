import {
  type ParsedReleaseMetadata,
  parseReleaseMetadata,
} from 'src/utils/releaseMetadata';
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

/**
 * Parse structured release metadata from the album title.
 */
export function getReleaseMetadataFromAlbum(
  album: Album,
): ParsedReleaseMetadata {
  const metadata = parseReleaseMetadata(album.title);

  if (!metadata.releaseYear && album.metadata?.year) {
    metadata.releaseYear = album.metadata.year;
  }

  return metadata;
}
