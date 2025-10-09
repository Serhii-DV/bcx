import { storage } from 'src/core/shared';
import { Band } from './band';
import { StorageKey } from './storageKey';

export class BandcampStorage {
  static async getBands(): Promise<Band[]> {
    // TODO: For better performance, consider maintaining a 'band.ids' index
    // to avoid loading all storage data. Currently using getAll() for simplicity.
    const allData = await storage.getAll();
    const bands: Band[] = [];

    for (const [key, value] of Object.entries(allData)) {
      if (StorageKey.isBandKey(key) && key !== 'band.ids') {
        const band = this.createBandFromStorageObject(value, allData);
        if (band) {
          bands.push(band);
        }
      }
    }

    return bands;
  }

  private static createBandFromStorageObject(
    bandStorageObject: any,
    allData: { [key: string]: any },
  ): Band | null {
    if (!bandStorageObject || typeof bandStorageObject !== 'object') {
      return null;
    }

    const albumIds: number[] = bandStorageObject.albums || [];
    const albumStorageObjects: any[] = [];

    for (const albumId of albumIds) {
      const albumKey = StorageKey.albumKey(albumId);
      const albumData = allData[albumKey];
      if (albumData) {
        albumStorageObjects.push(albumData);
      }
    }

    return Band.fromStorageObject(bandStorageObject, albumStorageObjects);
  }
}
