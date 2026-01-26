import { arrayUnique } from 'src/utils/array';
import type { Track } from './track';

export function getArtistNamesFromTracks(tracks: Track[]): string[] {
  const artistNames: string[] = [];

  tracks.forEach((track: Track) => {
    artistNames.push(...track.artist.names);
  });

  return artistNames;
}

export function getUniqueArtistNamesFromTracks(tracks: Track[]): string[] {
  return arrayUnique(getArtistNamesFromTracks(tracks)).sort();
}
