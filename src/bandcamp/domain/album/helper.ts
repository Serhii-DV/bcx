import {
  type ParsedReleaseMetadata,
  parseReleaseMetadata,
} from 'src/utils/releaseMetadata';
import { isVariousArtists } from '../artist/artist';
import { getArtistNamesFromTracks } from '../track/helper';
import type { Track } from '../track/track';
import { Album } from './album';

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

// Preserve display spellings while grouping case-insensitively in one pass.
export function groupAlbumsByArtist(albums: Album[]): Map<string, Album[]> {
  return groupReleasesByArtist(albums);
}

export function groupReleasesByArtist<T extends Album | Track>(
  releases: T[],
): Map<string, T[]> {
  const groups = new Map<string, number[]>();
  const names = new Set<string>();
  const compilations: number[] = [];
  for (const [index, release] of releases.entries()) {
    const releaseNames =
      release instanceof Album
        ? getArtistNamesFromAlbums([release])
        : getArtistNamesFromTracks([release]);
    for (const name of releaseNames) names.add(name);
    if (release.artist.isVariousArtists) compilations.push(index);
    for (const key of new Set(releaseNames.map((name) => name.toLowerCase()))) {
      const releases = groups.get(key) ?? [];
      releases.push(index);
      groups.set(key, releases);
    }
  }
  return new Map(
    [...names].sort().map((name) => {
      const matches = groups.get(name.toLowerCase()) ?? [];
      // Compilation aliases also match all compilation releases, as containsArtistName does.
      const indexes = isVariousArtists(name)
        ? [...new Set([...matches, ...compilations])].sort((a, b) => a - b)
        : matches;
      return [name, indexes.map((index) => releases[index])];
    }),
  );
}
