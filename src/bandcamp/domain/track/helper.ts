import { arrayUnique } from 'src/utils/array';
import type { Track } from './track';

export function getTracksArtistNames(tracks: Track[]): string[] {
  const artistNames: string[] = [];

  tracks.forEach((track) => {
    artistNames.push(...track.artist.names);
  });

  return arrayUnique(artistNames).sort();
}
