export function containsArtistName(artists: string[], name: string): boolean {
  return artists.some(
    (artistName) => artistName.toLowerCase() === name.toLowerCase(),
  );
}
