import { storage } from 'src/core/shared';
import type { MusicSearchData } from '$lib/components/bcx/types';
import { Band } from '../band';

export function createMusicSearchDataFromBand(band: Band): MusicSearchData {
  return {
    bands: [band],
    albums: band.albums,
  };
}

export function createMusicSearchDataFromBands(bands: Band[]): MusicSearchData {
  const allAlbums = bands.flatMap((band) => band.albums);

  return {
    bands: bands,
    albums: allAlbums,
  };
}

export async function getBandsFromStorage(): Promise<Band[]> {
  // TODO: For better performance, consider maintaining a 'band.ids' index
  // to avoid loading all storage data. Currently using getAll() for simplicity.
  const allData = await storage.getAll();
  const bands: Band[] = [];

  for (const [key, value] of Object.entries(allData)) {
    if (key.startsWith('band.') && key !== 'band.ids') {
      const band = Band.fromStorageObject(value);
      bands.push(band);
    }
  }

  return bands;
}
