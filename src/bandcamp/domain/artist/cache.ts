import { Artist } from './artist';

export class ArtistMemoryCache {
  private memoryCache = new Map<string, Artist>();

  get(input: string): Artist | undefined {
    return this.memoryCache.get(input);
  }

  set(input: string, artist: Artist): Artist {
    this.memoryCache.set(input, artist);
    return artist;
  }

  clear(): void {
    this.memoryCache.clear();
  }

  size(): number {
    return this.memoryCache.size;
  }
}
